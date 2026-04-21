import type { Shape } from "@canvasly/shared";

export function pointInShape(s: Shape, px: number, py: number): boolean {
  const lx = px - (s.x + s.width / 2);
  const ly = py - (s.y + s.height / 2);
  const cos = Math.cos(-(s.rotation ?? 0));
  const sin = Math.sin(-(s.rotation ?? 0));
  const rx = lx * cos - ly * sin + s.width / 2;
  const ry = lx * sin + ly * cos + s.height / 2;

  if (s.type === "ellipse") {
    const a = s.width / 2;
    const b = s.height / 2;
    const dx = (rx - a) / a;
    const dy = (ry - b) / b;
    return dx * dx + dy * dy <= 1;
  }
  return rx >= 0 && rx <= s.width && ry >= 0 && ry <= s.height;
}
