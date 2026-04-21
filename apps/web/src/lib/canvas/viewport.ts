export type Viewport = { x: number; y: number; zoom: number };

export const identityViewport: Viewport = { x: 0, y: 0, zoom: 1 };

export function screenToWorld(v: Viewport, sx: number, sy: number) {
  return { x: (sx - v.x) / v.zoom, y: (sy - v.y) / v.zoom };
}

export function worldToScreen(v: Viewport, wx: number, wy: number) {
  return { x: wx * v.zoom + v.x, y: wy * v.zoom + v.y };
}

export function pan(v: Viewport, dx: number, dy: number): Viewport {
  return { ...v, x: v.x + dx, y: v.y + dy };
}

export function zoomAt(v: Viewport, sx: number, sy: number, factor: number): Viewport {
  const zoom = Math.max(0.1, Math.min(4, v.zoom * factor));
  const clamped = Number(zoom.toFixed(4));
  const world = screenToWorld(v, sx, sy);
  return { zoom: clamped, x: sx - world.x * clamped, y: sy - world.y * clamped };
}
