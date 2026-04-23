import * as Y from "yjs";

export type Comment = {
  id: string;
  userId: string;
  userName: string;
  userColor: string;
  text: string;
  at: number;
};

export function getComments(doc: Y.Doc): Y.Map<Y.Array<Comment>> {
  return doc.getMap<Y.Array<Comment>>("comments");
}

export function listComments(doc: Y.Doc, shapeId: string): Comment[] {
  const map = getComments(doc);
  const arr = map.get(shapeId);
  return arr ? arr.toArray() : [];
}

export function addComment(doc: Y.Doc, shapeId: string, comment: Comment, origin: unknown) {
  const map = getComments(doc);
  doc.transact(() => {
    let arr = map.get(shapeId);
    if (!arr) {
      arr = new Y.Array<Comment>();
      map.set(shapeId, arr);
    }
    arr.push([comment]);
  }, origin);
}

export function deleteComment(doc: Y.Doc, shapeId: string, commentId: string, origin: unknown) {
  const map = getComments(doc);
  const arr = map.get(shapeId);
  if (!arr) return;
  doc.transact(() => {
    const idx = arr.toArray().findIndex((c) => c.id === commentId);
    if (idx >= 0) arr.delete(idx, 1);
  }, origin);
}
