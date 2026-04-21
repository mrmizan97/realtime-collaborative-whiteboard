import * as Y from "yjs";
import * as syncProtocol from "y-protocols/sync";
import * as awarenessProtocol from "y-protocols/awareness";
import { encoding, decoding } from "lib0";
import type { WebSocket } from "ws";
import { createAwareness, AwarenessRateLimiter } from "./awareness.js";
import {
  appendUpdate,
  loadLatestSnapshot,
  writeSnapshot,
} from "./persistence.js";
import { logger } from "./logger.js";
import { metrics } from "./metrics.js";

const MESSAGE_SYNC = 0;
const MESSAGE_AWARENESS = 1;

const SNAPSHOT_UPDATE_THRESHOLD = 50;
const SNAPSHOT_DEBOUNCE_MS = 2000;

type Role = "owner" | "editor" | "viewer";

export type Connection = {
  ws: WebSocket;
  userId: string;
  role: Role;
  clientId: number;
  limiter: AwarenessRateLimiter;
};

export class Room {
  readonly id: string;
  readonly doc = new Y.Doc();
  readonly awareness = createAwareness(this.doc);
  readonly connections = new Set<Connection>();
  private pendingUpdates = 0;
  private debounceTimer: NodeJS.Timeout | null = null;
  private destroyed = false;
  private hydrated = false;

  constructor(id: string) {
    this.id = id;
    this.doc.on("update", this.onDocUpdate);
    this.awareness.on("update", this.onAwarenessUpdate);
  }

  async hydrate(): Promise<void> {
    if (this.hydrated) return;
    const state = await loadLatestSnapshot(this.id);
    if (state) Y.applyUpdate(this.doc, state);
    this.hydrated = true;
    metrics.incActiveRooms();
    logger.info({ roomId: this.id, bytes: state?.byteLength ?? 0 }, "room hydrated");
  }

  addConnection(conn: Connection) {
    this.connections.add(conn);
    this.sendSyncStep1(conn);
    this.sendAwarenessSnapshot(conn);
    metrics.incConnections();
  }

  removeConnection(conn: Connection) {
    this.connections.delete(conn);
    awarenessProtocol.removeAwarenessStates(this.awareness, [conn.clientId], "disconnect");
    metrics.decConnections();
    if (this.connections.size === 0) this.scheduleFlushAndGc();
  }

  handleMessage(conn: Connection, data: Uint8Array) {
    const decoder = decoding.createDecoder(data);
    const encoder = encoding.createEncoder();
    const kind = decoding.readVarUint(decoder);

    if (kind === MESSAGE_SYNC) {
      if (conn.role === "viewer") {
        const peek = decoding.clone(decoder);
        const syncKind = decoding.readVarUint(peek);
        if (syncKind === syncProtocol.messageYjsUpdate) {
          conn.ws.close(1008, "viewer cannot write");
          return;
        }
      }
      encoding.writeVarUint(encoder, MESSAGE_SYNC);
      syncProtocol.readSyncMessage(decoder, encoder, this.doc, conn);
      if (encoding.length(encoder) > 1) send(conn.ws, encoding.toUint8Array(encoder));
    } else if (kind === MESSAGE_AWARENESS) {
      if (!conn.limiter.allow()) return;
      awarenessProtocol.applyAwarenessUpdate(
        this.awareness,
        decoding.readVarUint8Array(decoder),
        conn,
      );
    }
  }

  private onDocUpdate = (update: Uint8Array, origin: unknown) => {
    metrics.incUpdates();
    this.pendingUpdates++;

    const originUserId =
      origin && typeof origin === "object" && "userId" in origin
        ? String((origin as Connection).userId)
        : null;
    void appendUpdate(this.id, update, originUserId);

    const message = encoding.createEncoder();
    encoding.writeVarUint(message, MESSAGE_SYNC);
    syncProtocol.writeUpdate(message, update);
    const bytes = encoding.toUint8Array(message);
    for (const c of this.connections) {
      if (c !== origin) send(c.ws, bytes);
    }

    if (this.pendingUpdates >= SNAPSHOT_UPDATE_THRESHOLD) this.flushSnapshot();
    else this.scheduleDebouncedFlush();
  };

  private onAwarenessUpdate = (
    { added, updated, removed }: { added: number[]; updated: number[]; removed: number[] },
    origin: unknown,
  ) => {
    const changed = added.concat(updated, removed);
    const update = awarenessProtocol.encodeAwarenessUpdate(this.awareness, changed);
    const enc = encoding.createEncoder();
    encoding.writeVarUint(enc, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(enc, update);
    const bytes = encoding.toUint8Array(enc);
    for (const c of this.connections) {
      if (c !== origin) send(c.ws, bytes);
    }
  };

  private sendSyncStep1(conn: Connection) {
    const enc = encoding.createEncoder();
    encoding.writeVarUint(enc, MESSAGE_SYNC);
    syncProtocol.writeSyncStep1(enc, this.doc);
    send(conn.ws, encoding.toUint8Array(enc));
  }

  private sendAwarenessSnapshot(conn: Connection) {
    const states = this.awareness.getStates();
    if (states.size === 0) return;
    const enc = encoding.createEncoder();
    encoding.writeVarUint(enc, MESSAGE_AWARENESS);
    encoding.writeVarUint8Array(
      enc,
      awarenessProtocol.encodeAwarenessUpdate(this.awareness, Array.from(states.keys())),
    );
    send(conn.ws, encoding.toUint8Array(enc));
  }

  private scheduleDebouncedFlush() {
    if (this.debounceTimer) return;
    this.debounceTimer = setTimeout(() => this.flushSnapshot(), SNAPSHOT_DEBOUNCE_MS);
  }

  private flushSnapshot() {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
      this.debounceTimer = null;
    }
    if (this.pendingUpdates === 0) return;
    const state = Y.encodeStateAsUpdate(this.doc);
    this.pendingUpdates = 0;
    void writeSnapshot(this.id, state);
  }

  private scheduleFlushAndGc() {
    this.flushSnapshot();
    setTimeout(() => {
      if (this.connections.size === 0) this.destroy();
    }, SNAPSHOT_DEBOUNCE_MS + 500);
  }

  destroy() {
    if (this.destroyed) return;
    this.destroyed = true;
    this.doc.off("update", this.onDocUpdate);
    this.awareness.destroy();
    this.doc.destroy();
    metrics.decActiveRooms();
    logger.info({ roomId: this.id }, "room destroyed");
  }
}

function send(ws: WebSocket, bytes: Uint8Array) {
  if (ws.readyState !== ws.OPEN) return;
  ws.send(bytes, { binary: true });
}
