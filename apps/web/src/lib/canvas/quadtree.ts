import type { Shape } from "@canvasly/shared";

export type Rect = { x: number; y: number; w: number; h: number };

function shapeBounds(s: Shape): Rect {
  return { x: s.x, y: s.y, w: s.width, h: s.height };
}

function intersects(a: Rect, b: Rect): boolean {
  return !(a.x + a.w < b.x || b.x + b.w < a.x || a.y + a.h < b.y || b.y + b.h < a.y);
}

export class Quadtree {
  private items: Shape[] = [];
  private children: Quadtree[] | null = null;
  constructor(private bounds: Rect, private capacity = 8, private depth = 0) {}

  insert(shape: Shape): void {
    if (this.children) {
      for (const c of this.children) if (intersects(c.bounds, shapeBounds(shape))) c.insert(shape);
      return;
    }
    this.items.push(shape);
    if (this.items.length > this.capacity && this.depth < 6) this.subdivide();
  }

  query(rect: Rect, out: Shape[] = []): Shape[] {
    if (!intersects(rect, this.bounds)) return out;
    for (const it of this.items) if (intersects(rect, shapeBounds(it))) out.push(it);
    if (this.children) for (const c of this.children) c.query(rect, out);
    return out;
  }

  private subdivide() {
    const { x, y, w, h } = this.bounds;
    const hw = w / 2, hh = h / 2;
    this.children = [
      new Quadtree({ x, y, w: hw, h: hh }, this.capacity, this.depth + 1),
      new Quadtree({ x: x + hw, y, w: hw, h: hh }, this.capacity, this.depth + 1),
      new Quadtree({ x, y: y + hh, w: hw, h: hh }, this.capacity, this.depth + 1),
      new Quadtree({ x: x + hw, y: y + hh, w: hw, h: hh }, this.capacity, this.depth + 1),
    ];
    const items = this.items;
    this.items = [];
    for (const it of items) this.insert(it);
  }
}

export function buildQuadtree(shapes: Shape[]): Quadtree {
  if (shapes.length === 0) return new Quadtree({ x: 0, y: 0, w: 1, h: 1 });
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of shapes) {
    if (s.x < minX) minX = s.x;
    if (s.y < minY) minY = s.y;
    if (s.x + s.width > maxX) maxX = s.x + s.width;
    if (s.y + s.height > maxY) maxY = s.y + s.height;
  }
  const pad = 100;
  const qt = new Quadtree({
    x: minX - pad,
    y: minY - pad,
    w: maxX - minX + 2 * pad,
    h: maxY - minY + 2 * pad,
  });
  for (const s of shapes) qt.insert(s);
  return qt;
}
