import type { Shape } from "@canvasly/shared";

export type SnapLine = { axis: "x" | "y"; pos: number; from: number; to: number };
export type SnapResult = { dx: number; dy: number; lines: SnapLine[] };

const THRESHOLD = 6;

type Box = { x: number; y: number; w: number; h: number };

function boxOf(s: Shape): Box {
  return { x: s.x, y: s.y, w: s.width, h: s.height };
}

export function computeSnap(
  moving: Box,
  others: Shape[],
  zoom: number,
): SnapResult {
  const tol = THRESHOLD / zoom;
  const lines: SnapLine[] = [];

  const movingLeft = moving.x;
  const movingRight = moving.x + moving.w;
  const movingCenterX = moving.x + moving.w / 2;
  const movingTop = moving.y;
  const movingBottom = moving.y + moving.h;
  const movingCenterY = moving.y + moving.h / 2;

  let dx = 0;
  let dy = 0;
  let bestDx = Infinity;
  let bestDy = Infinity;

  for (const s of others) {
    const b = boxOf(s);
    const edgesX = [b.x, b.x + b.w, b.x + b.w / 2];
    const edgesY = [b.y, b.y + b.h, b.y + b.h / 2];
    const movingEdgesX = [movingLeft, movingRight, movingCenterX];
    const movingEdgesY = [movingTop, movingBottom, movingCenterY];

    for (const mx of movingEdgesX) {
      for (const ex of edgesX) {
        const delta = ex - mx;
        if (Math.abs(delta) < tol && Math.abs(delta) < Math.abs(bestDx)) {
          bestDx = delta;
        }
        if (Math.abs(delta) < tol) {
          lines.push({
            axis: "x",
            pos: ex,
            from: Math.min(moving.y, b.y),
            to: Math.max(moving.y + moving.h, b.y + b.h),
          });
        }
      }
    }
    for (const my of movingEdgesY) {
      for (const ey of edgesY) {
        const delta = ey - my;
        if (Math.abs(delta) < tol && Math.abs(delta) < Math.abs(bestDy)) {
          bestDy = delta;
        }
        if (Math.abs(delta) < tol) {
          lines.push({
            axis: "y",
            pos: ey,
            from: Math.min(moving.x, b.x),
            to: Math.max(moving.x + moving.w, b.x + b.w),
          });
        }
      }
    }
  }

  if (bestDx !== Infinity) dx = bestDx;
  if (bestDy !== Infinity) dy = bestDy;

  const filtered = lines.filter(
    (l) =>
      (l.axis === "x" && Math.abs(bestDx) < tol && Math.abs(l.pos - movingLeft - dx) < 1) ||
      (l.axis === "x" && Math.abs(bestDx) < tol && Math.abs(l.pos - movingRight - dx) < 1) ||
      (l.axis === "x" && Math.abs(bestDx) < tol && Math.abs(l.pos - movingCenterX - dx) < 1) ||
      (l.axis === "y" && Math.abs(bestDy) < tol && Math.abs(l.pos - movingTop - dy) < 1) ||
      (l.axis === "y" && Math.abs(bestDy) < tol && Math.abs(l.pos - movingBottom - dy) < 1) ||
      (l.axis === "y" && Math.abs(bestDy) < tol && Math.abs(l.pos - movingCenterY - dy) < 1),
  );

  return { dx, dy, lines: filtered };
}
