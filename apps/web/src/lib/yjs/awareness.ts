import type { WebsocketProvider } from "y-websocket";
import type { AwarenessState } from "@canvasly/shared";

const THROTTLE_HZ = 30;
const MIN_INTERVAL_MS = 1000 / THROTTLE_HZ;

export function initLocalAwareness(ws: WebsocketProvider, state: AwarenessState) {
  ws.awareness.setLocalState(state);
}

export function patchLocalAwareness(
  ws: WebsocketProvider,
  patch: Partial<AwarenessState>,
) {
  const current = ws.awareness.getLocalState() as AwarenessState | null;
  ws.awareness.setLocalState({ ...(current ?? ({} as AwarenessState)), ...patch });
}

export class CursorThrottle {
  private lastAt = 0;
  maybeSend(fn: () => void) {
    const now = Date.now();
    if (now - this.lastAt < MIN_INTERVAL_MS) return;
    this.lastAt = now;
    fn();
  }
}
