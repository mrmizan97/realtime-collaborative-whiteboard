import * as Y from "yjs";
import { getShapes, getOrder } from "./doc";

export const LOCAL_ORIGIN = Symbol("local-origin");

export function makeUndoManager(doc: Y.Doc): Y.UndoManager {
  return new Y.UndoManager([getShapes(doc), getOrder(doc)], {
    trackedOrigins: new Set([LOCAL_ORIGIN]),
    captureTimeout: 500,
  });
}
