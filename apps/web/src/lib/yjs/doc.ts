import * as Y from "yjs";
import type { Shape } from "@canvasly/shared";

export type YDoc = Y.Doc;
export type YShapeMap = Y.Map<unknown>;

export function getShapes(doc: Y.Doc): Y.Map<YShapeMap> {
  return doc.getMap<YShapeMap>("shapes");
}
export function getOrder(doc: Y.Doc): Y.Array<string> {
  return doc.getArray<string>("order");
}
export function getGroups(doc: Y.Doc): Y.Map<Y.Array<string>> {
  return doc.getMap<Y.Array<string>>("groups");
}
export function getMeta(doc: Y.Doc): Y.Map<unknown> {
  return doc.getMap<unknown>("meta");
}

export function readShape(yMap: YShapeMap): Shape {
  const out: Record<string, unknown> = {};
  yMap.forEach((v, k) => (out[k] = v));
  return out as Shape;
}

export function getShape(doc: Y.Doc, id: string): Shape | null {
  const m = getShapes(doc).get(id);
  return m ? readShape(m) : null;
}

export function listShapesInOrder(doc: Y.Doc): Shape[] {
  const shapes = getShapes(doc);
  const order = getOrder(doc);
  const result: Shape[] = [];
  order.forEach((id) => {
    const m = shapes.get(id);
    if (m) result.push(readShape(m));
  });
  return result;
}

export function addShape(doc: Y.Doc, shape: Shape, origin: unknown): void {
  const shapes = getShapes(doc);
  const order = getOrder(doc);
  doc.transact(() => {
    const y = new Y.Map<unknown>();
    for (const [k, v] of Object.entries(shape)) y.set(k, v);
    shapes.set(shape.id, y);
    order.push([shape.id]);
  }, origin);
}

export function updateShape(
  doc: Y.Doc,
  id: string,
  patch: Partial<Shape>,
  origin: unknown,
): void {
  const m = getShapes(doc).get(id);
  if (!m) return;
  doc.transact(() => {
    for (const [k, v] of Object.entries(patch)) m.set(k, v);
  }, origin);
}

export function deleteShape(doc: Y.Doc, id: string, origin: unknown): void {
  const shapes = getShapes(doc);
  const order = getOrder(doc);
  doc.transact(() => {
    shapes.delete(id);
    const idx = order.toArray().indexOf(id);
    if (idx >= 0) order.delete(idx, 1);
  }, origin);
}

export function deleteMany(doc: Y.Doc, ids: string[], origin: unknown): void {
  const shapes = getShapes(doc);
  const order = getOrder(doc);
  doc.transact(() => {
    for (const id of ids) {
      shapes.delete(id);
      const idx = order.toArray().indexOf(id);
      if (idx >= 0) order.delete(idx, 1);
    }
  }, origin);
}

export function bringToFront(doc: Y.Doc, ids: string[], origin: unknown): void {
  const order = getOrder(doc);
  doc.transact(() => {
    for (const id of ids) {
      const idx = order.toArray().indexOf(id);
      if (idx >= 0) {
        order.delete(idx, 1);
        order.push([id]);
      }
    }
  }, origin);
}

export function sendToBack(doc: Y.Doc, ids: string[], origin: unknown): void {
  const order = getOrder(doc);
  doc.transact(() => {
    for (let i = ids.length - 1; i >= 0; i--) {
      const id = ids[i]!;
      const idx = order.toArray().indexOf(id);
      if (idx >= 0) {
        order.delete(idx, 1);
        order.insert(0, [id]);
      }
    }
  }, origin);
}

export function groupShapes(doc: Y.Doc, ids: string[], origin: unknown): string {
  const groupId = crypto.randomUUID();
  const groups = getGroups(doc);
  doc.transact(() => {
    const arr = new Y.Array<string>();
    arr.insert(0, ids);
    groups.set(groupId, arr);
    for (const id of ids) {
      const m = getShapes(doc).get(id);
      if (m) m.set("groupId", groupId);
    }
  }, origin);
  return groupId;
}

export function ungroupShapes(doc: Y.Doc, groupId: string, origin: unknown): void {
  const groups = getGroups(doc);
  const arr = groups.get(groupId);
  if (!arr) return;
  doc.transact(() => {
    arr.forEach((id) => {
      const m = getShapes(doc).get(id);
      if (m) m.set("groupId", null);
    });
    groups.delete(groupId);
  }, origin);
}
