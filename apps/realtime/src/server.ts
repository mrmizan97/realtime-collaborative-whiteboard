import { createServer } from "node:http";
import { WebSocketServer } from "ws";
import { verifyToken } from "./auth.js";
import { Room, type Connection } from "./room.js";
import { AwarenessRateLimiter } from "./awareness.js";
import { logger } from "./logger.js";
import { metrics } from "./metrics.js";

const PORT = Number(process.env.REALTIME_PORT ?? 4000);
const rooms = new Map<string, Room>();

async function getOrCreateRoom(roomId: string): Promise<Room> {
  let room = rooms.get(roomId);
  if (room) return room;
  room = new Room(roomId);
  rooms.set(roomId, room);
  await room.hydrate();
  return room;
}

const http = createServer((req, res) => {
  if (req.url === "/metrics") {
    res.writeHead(200, { "content-type": "text/plain; version=0.0.4" });
    res.end(metrics.render());
    return;
  }
  if (req.url === "/healthz") {
    res.writeHead(200, { "content-type": "text/plain" });
    res.end("ok");
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ noServer: true });

http.on("upgrade", async (req, socket, head) => {
  try {
    const url = new URL(req.url ?? "", `http://${req.headers.host}`);
    const token = url.searchParams.get("token") ?? undefined;
    const roomFromQuery = url.searchParams.get("room") ?? "";
    const claims = await verifyToken(token);

    if (!claims) {
      metrics.incConnectFail();
      logger.warn({ url: req.url }, "ws upgrade rejected: invalid/missing token");
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }
    if (roomFromQuery && claims.room !== roomFromQuery) {
      metrics.incConnectFail();
      logger.warn(
        { tokenRoom: claims.room, queryRoom: roomFromQuery },
        "ws upgrade rejected: token/room mismatch",
      );
      socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
      socket.destroy();
      return;
    }

    wss.handleUpgrade(req, socket, head, async (ws) => {
      const room = await getOrCreateRoom(claims.room);
      const conn: Connection = {
        ws,
        userId: claims.sub,
        role: claims.role,
        clientId: Math.floor(Math.random() * 2 ** 31),
        limiter: new AwarenessRateLimiter(),
      };
      room.addConnection(conn);
      logger.info(
        { roomId: claims.room, userId: claims.sub, role: claims.role, peers: room.connections.size },
        "ws connected",
      );

      ws.on("message", (data) => {
        const buf = data instanceof Buffer ? new Uint8Array(data) : new Uint8Array(data as ArrayBuffer);
        room.handleMessage(conn, buf);
      });
      ws.on("close", (code) => {
        room.removeConnection(conn);
        logger.info(
          { roomId: claims.room, userId: claims.sub, code, peers: room.connections.size },
          "ws closed",
        );
        if (room.connections.size === 0) {
          setTimeout(() => {
            if (room.connections.size === 0) rooms.delete(room.id);
          }, 5000);
        }
      });
      ws.on("error", (err) => logger.warn({ err }, "ws error"));
    });
  } catch (err) {
    logger.error({ err }, "upgrade failed");
    socket.destroy();
  }
});

http.listen(PORT, () => logger.info({ port: PORT }, "realtime server listening"));
