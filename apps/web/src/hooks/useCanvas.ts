"use client";
import { useEffect, useRef } from "react";
import type { WebsocketProvider } from "y-websocket";
import { mountProviders, type ProviderStack } from "@/lib/yjs/provider";
import { startRenderer, type RendererHandle } from "@/lib/canvas/renderer";
import { useViewportStore } from "@/stores/viewport";
import { useToolStore } from "@/stores/tool";
import { bindConnectionStatus } from "@/lib/offline/status";
import { useAwarenessStore, type PeerEntry } from "@/stores/awareness";
import { useSelectionStore } from "@/stores/selection";
import { useFollowStore } from "@/stores/follow";
import { makeUndoManager, LOCAL_ORIGIN } from "@/lib/yjs/undo";
import { selectTool } from "@/lib/canvas/tools/select";
import { rectangleTool } from "@/lib/canvas/tools/rectangle";
import { ellipseTool } from "@/lib/canvas/tools/ellipse";
import { penTool } from "@/lib/canvas/tools/pen";
import { panTool } from "@/lib/canvas/tools/pan";
import { lineTool } from "@/lib/canvas/tools/line";
import { arrowTool } from "@/lib/canvas/tools/arrow";
import { textTool } from "@/lib/canvas/tools/text";
import { stickyTool } from "@/lib/canvas/tools/sticky";
import { frameTool } from "@/lib/canvas/tools/frame";
import { imageTool } from "@/lib/canvas/tools/image";
import { connectorTool } from "@/lib/canvas/tools/connector";
import { screenToWorld, zoomAt } from "@/lib/canvas/viewport";
import { CursorThrottle, patchLocalAwareness, initLocalAwareness } from "@/lib/yjs/awareness";
import { colorForUser } from "@/lib/yjs/colors";
import { useUser } from "@/stores/user";
import { deleteMany } from "@/lib/yjs/doc";
import { useDocStore } from "@/stores/doc";
import type { Tool } from "@/lib/canvas/tools";
import type { AwarenessState } from "@canvasly/shared";

const TOOLS: Record<string, Tool> = {
  select: selectTool,
  rectangle: rectangleTool,
  ellipse: ellipseTool,
  pen: penTool,
  pan: panTool,
  line: lineTool,
  arrow: arrowTool,
  text: textTool,
  sticky: stickyTool,
  frame: frameTool,
  image: imageTool,
  connector: connectorTool,
};

export function useCanvas(slug: string) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const providersRef = useRef<ProviderStack | null>(null);
  const rendererRef = useRef<RendererHandle | null>(null);
  const undoRef = useRef<ReturnType<typeof makeUndoManager> | null>(null);
  const docRef = useRef<import("yjs").Doc | null>(null);
  const wsRef = useRef<WebsocketProvider | null>(null);

  useEffect(() => {
    let destroyed = false;
    let cleanup: (() => void) | null = null;

    (async () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const providers = await mountProviders(slug);
      if (destroyed) {
        providers.destroy();
        return;
      }
      providersRef.current = providers;
      docRef.current = providers.doc;
      wsRef.current = providers.ws;
      undoRef.current = makeUndoManager(providers.doc);
      useDocStore.getState().set(providers.doc, providers.ws);

      const user = useUser.getState().user;
      if (user) {
        initLocalAwareness(providers.ws, {
          user: {
            id: user.id,
            name: user.name,
            avatarUrl: user.avatarUrl,
            color: colorForUser(user.id),
          },
          cursor: null,
          selection: [],
          viewing: true,
          viewport: useViewportStore.getState().viewport,
        });
      }

      const renderer = startRenderer({
        canvas,
        doc: providers.doc,
        getViewport: () => useViewportStore.getState().viewport,
        getSize: () => ({
          width: canvas.clientWidth,
          height: canvas.clientHeight,
          dpr: window.devicePixelRatio || 1,
        }),
      });
      rendererRef.current = renderer;

      const ro = new ResizeObserver(() => renderer.markDirty());
      ro.observe(canvas);

      const unbindStatus = bindConnectionStatus(providers.ws);

      const syncAwareness = () => {
        const states = providers.ws.awareness.getStates();
        const map = new Map<number, PeerEntry>();
        states.forEach((v, clientId) => {
          if (clientId === providers.ws.awareness.clientID) return;
          map.set(clientId, { ...(v as AwarenessState), clientId });
        });
        useAwarenessStore.getState().setAll(map);

        const followingId = useFollowStore.getState().followingClientId;
        if (followingId != null) {
          const peer = map.get(followingId);
          if (peer?.viewport) useViewportStore.getState().setViewport(peer.viewport);
        }
      };
      providers.ws.awareness.on("change", syncAwareness);
      syncAwareness();

      const unsubSel = useSelectionStore.subscribe((state) => {
        patchLocalAwareness(providers.ws, { selection: state.ids });
      });

      let vpThrottle = 0;
      const unsubVpShare = useViewportStore.subscribe((state) => {
        const now = Date.now();
        if (now - vpThrottle < 80) return;
        vpThrottle = now;
        patchLocalAwareness(providers.ws, { viewport: state.viewport });
      });

      const onVisibility = () =>
        patchLocalAwareness(providers.ws, { viewing: !document.hidden });
      document.addEventListener("visibilitychange", onVisibility);

      const throttle = new CursorThrottle();
      const makeCtx = () => ({
        doc: providers.doc,
        origin: LOCAL_ORIGIN,
        getViewport: () => useViewportStore.getState().viewport,
        setViewport: useViewportStore.getState().setViewport,
      });

      const handlePointerDown = (e: PointerEvent) => {
        canvas.setPointerCapture(e.pointerId);
        const rect = canvas.getBoundingClientRect();
        const v = useViewportStore.getState().viewport;
        const world = screenToWorld(v, e.clientX - rect.left, e.clientY - rect.top);
        if (useFollowStore.getState().followingClientId != null) {
          useFollowStore.getState().follow(null);
        }
        TOOLS[useToolStore.getState().active]?.onPointerDown(makeCtx(), world, e);
      };
      const handlePointerMove = (e: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        const v = useViewportStore.getState().viewport;
        const world = screenToWorld(v, e.clientX - rect.left, e.clientY - rect.top);
        TOOLS[useToolStore.getState().active]?.onPointerMove(makeCtx(), world, e);
        throttle.maybeSend(() => patchLocalAwareness(providers.ws, { cursor: world }));
      };
      const handlePointerUp = (e: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        const v = useViewportStore.getState().viewport;
        const world = screenToWorld(v, e.clientX - rect.left, e.clientY - rect.top);
        TOOLS[useToolStore.getState().active]?.onPointerUp(makeCtx(), world, e);
      };
      const handleWheel = (e: WheelEvent) => {
        if (!e.ctrlKey && !e.metaKey) return;
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const sx = e.clientX - rect.left;
        const sy = e.clientY - rect.top;
        const v = useViewportStore.getState().viewport;
        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        useViewportStore.getState().setViewport(zoomAt(v, sx, sy, factor));
      };

      const handleKeyDown = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement | null;
        if (target && ["INPUT", "TEXTAREA"].includes(target.tagName)) return;
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
          e.preventDefault();
          if (e.shiftKey) undoRef.current?.redo();
          else undoRef.current?.undo();
          return;
        }
        if (e.key === "Delete" || e.key === "Backspace") {
          const ids = useSelectionStore.getState().ids;
          if (ids.length > 0 && providers.doc) {
            deleteMany(providers.doc, ids, LOCAL_ORIGIN);
            useSelectionStore.getState().clear();
          }
          return;
        }
        if (e.key === "Escape") {
          useFollowStore.getState().follow(null);
          useSelectionStore.getState().clear();
        }
        const map: Record<string, string> = {
          v: "select",
          h: "pan",
          r: "rectangle",
          o: "ellipse",
          p: "pen",
          t: "text",
          a: "arrow",
          l: "line",
          s: "sticky",
          f: "frame",
          i: "image",
          c: "connector",
        };
        const tool = map[e.key.toLowerCase()];
        if (tool) useToolStore.getState().setTool(tool as never);
      };

      canvas.addEventListener("pointerdown", handlePointerDown);
      canvas.addEventListener("pointermove", handlePointerMove);
      canvas.addEventListener("pointerup", handlePointerUp);
      canvas.addEventListener("wheel", handleWheel, { passive: false });
      window.addEventListener("keydown", handleKeyDown);

      const unsubVp = useViewportStore.subscribe(() => renderer.markDirty());

      cleanup = () => {
        ro.disconnect();
        canvas.removeEventListener("pointerdown", handlePointerDown);
        canvas.removeEventListener("pointermove", handlePointerMove);
        canvas.removeEventListener("pointerup", handlePointerUp);
        canvas.removeEventListener("wheel", handleWheel);
        window.removeEventListener("keydown", handleKeyDown);
        document.removeEventListener("visibilitychange", onVisibility);
        providers.ws.awareness.off("change", syncAwareness);
        unbindStatus();
        unsubVp();
        unsubVpShare();
        unsubSel();
        renderer.stop();
        undoRef.current?.destroy();
        useDocStore.getState().set(null, null);
        providers.destroy();
      };
    })();

    return () => {
      destroyed = true;
      cleanup?.();
    };
  }, [slug]);

  return {
    canvasRef,
    docRef,
    wsRef,
    undo: () => undoRef.current?.undo(),
    redo: () => undoRef.current?.redo(),
  };
}
