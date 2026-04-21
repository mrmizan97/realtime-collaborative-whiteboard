import * as awarenessProtocol from "y-protocols/awareness";

const AWARENESS_TIMEOUT_MS = 30_000;
const RATE_LIMIT_HZ = 60;
const MIN_INTERVAL_MS = 1000 / RATE_LIMIT_HZ;

export function createAwareness(doc: import("yjs").Doc) {
  const a = new awarenessProtocol.Awareness(doc);
  a.setLocalState(null);
  return a;
}

export class AwarenessRateLimiter {
  private lastAt = 0;
  allow(): boolean {
    const now = Date.now();
    if (now - this.lastAt < MIN_INTERVAL_MS) return false;
    this.lastAt = now;
    return true;
  }
}

export { AWARENESS_TIMEOUT_MS };
