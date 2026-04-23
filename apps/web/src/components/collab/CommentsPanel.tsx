"use client";
import { useEffect, useState } from "react";
import type * as Y from "yjs";
import { MessageCircle, X } from "lucide-react";
import { useSelectionStore } from "@/stores/selection";
import { useUser } from "@/stores/user";
import { colorForUser } from "@/lib/yjs/colors";
import { LOCAL_ORIGIN } from "@/lib/yjs/undo";
import { addComment, deleteComment, listComments, getComments, type Comment } from "@/lib/yjs/comments";

export function CommentsPanel({ docRef }: { docRef: React.MutableRefObject<Y.Doc | null> }) {
  const [open, setOpen] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [draft, setDraft] = useState("");
  const ids = useSelectionStore((s) => s.ids);
  const shapeId = ids.length === 1 ? ids[0]! : null;
  const user = useUser((s) => s.user);

  useEffect(() => {
    const doc = docRef.current;
    if (!doc || !shapeId) {
      setComments([]);
      return;
    }
    const read = () => setComments(listComments(doc, shapeId));
    read();
    const map = getComments(doc);
    map.observeDeep(read);
    return () => map.unobserveDeep(read);
  }, [shapeId, docRef]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const doc = docRef.current;
    if (!doc || !shapeId || !user || !draft.trim()) return;
    addComment(
      doc,
      shapeId,
      {
        id: crypto.randomUUID(),
        userId: user.id,
        userName: user.name,
        userColor: colorForUser(user.id),
        text: draft.trim(),
        at: Date.now(),
      },
      LOCAL_ORIGIN,
    );
    setDraft("");
  }

  function remove(id: string) {
    const doc = docRef.current;
    if (!doc || !shapeId) return;
    deleteComment(doc, shapeId, id, LOCAL_ORIGIN);
  }

  const badgeCount = comments.length;

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={!shapeId}
        title={shapeId ? "Comments" : "Select a shape to comment"}
        className="relative px-2 py-1 border border-neutral-300 rounded-md text-sm flex items-center gap-1.5 bg-white disabled:opacity-50"
      >
        <MessageCircle className="w-3.5 h-3.5" />
        {badgeCount > 0 && (
          <span className="absolute -top-1 -right-1 text-[10px] bg-blue-500 text-white rounded-full w-4 h-4 flex items-center justify-center">
            {badgeCount}
          </span>
        )}
      </button>
      {open && shapeId && (
        <div className="fixed right-3 top-14 bottom-3 w-80 bg-white border border-neutral-200 rounded-md shadow-lg z-40 flex flex-col">
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="text-sm font-medium">Comments</h3>
            <button onClick={() => setOpen(false)} className="p-1 hover:bg-neutral-100 rounded">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="flex-1 overflow-auto p-3 space-y-3">
            {comments.length === 0 && (
              <p className="text-xs text-neutral-500">No comments yet.</p>
            )}
            {comments.map((c) => (
              <div key={c.id} className="text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <span
                    className="w-5 h-5 rounded-full text-white text-[10px] flex items-center justify-center"
                    style={{ background: c.userColor }}
                  >
                    {c.userName.slice(0, 1).toUpperCase()}
                  </span>
                  <span className="font-medium">{c.userName}</span>
                  <span className="text-xs text-neutral-400">
                    {new Date(c.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  {user?.id === c.userId && (
                    <button
                      onClick={() => remove(c.id)}
                      className="ml-auto text-xs text-red-600 hover:underline"
                    >
                      delete
                    </button>
                  )}
                </div>
                <p className="pl-7 text-neutral-700 whitespace-pre-wrap">{c.text}</p>
              </div>
            ))}
          </div>
          <form onSubmit={submit} className="p-3 border-t space-y-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              placeholder="Write a comment…"
              className="w-full px-2 py-1.5 border border-neutral-300 rounded-md text-sm resize-none"
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === "Enter") submit(e);
              }}
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              className="w-full px-3 py-1.5 bg-neutral-900 text-white rounded-md text-sm disabled:opacity-50"
            >
              Comment
            </button>
          </form>
        </div>
      )}
    </>
  );
}
