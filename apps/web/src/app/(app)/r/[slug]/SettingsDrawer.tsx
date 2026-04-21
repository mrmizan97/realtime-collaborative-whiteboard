"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Trash2 } from "lucide-react";

type Member = { userId: string; email: string | null; name: string | null; role: string };

export function SettingsDrawer({
  slug,
  initialName,
  isOwner,
}: {
  slug: string;
  initialName: string;
  isOwner: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (!open) return;
    fetch(`/api/rooms/${slug}/members`)
      .then((r) => r.json())
      .then((d) => setMembers(d.members ?? []));
  }, [open, slug]);

  async function saveName() {
    await fetch(`/api/rooms/${slug}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name }),
    });
    router.refresh();
  }

  async function changeRole(userId: string, role: string) {
    await fetch(`/api/rooms/${slug}/members`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    setMembers((ms) => ms.map((m) => (m.userId === userId ? { ...m, role } : m)));
  }

  async function removeMember(userId: string) {
    if (!confirm("Remove this member?")) return;
    await fetch(`/api/rooms/${slug}/members?userId=${userId}`, { method: "DELETE" });
    setMembers((ms) => ms.filter((m) => m.userId !== userId));
  }

  async function deleteRoom() {
    if (!confirm("Delete this room permanently?")) return;
    await fetch(`/api/rooms/${slug}`, { method: "DELETE" });
    router.push("/dashboard");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-2 py-1 border border-neutral-300 rounded-md text-sm flex items-center gap-1.5 bg-white"
      >
        <Settings className="w-3.5 h-3.5" />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setOpen(false)}
          />
          <aside className="relative w-96 bg-white h-full p-6 shadow-xl overflow-auto space-y-6">
            <h2 className="text-lg font-semibold">Room settings</h2>

            {isOwner && (
              <div>
                <label className="text-sm font-medium">Name</label>
                <div className="flex gap-2 mt-1.5">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="flex-1 px-3 py-2 border border-neutral-300 rounded-md text-sm"
                  />
                  <button onClick={saveName} className="px-3 py-2 bg-neutral-900 text-white rounded-md text-sm">
                    Save
                  </button>
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium mb-2">Members</h3>
              <ul className="space-y-2">
                {members.map((m) => (
                  <li key={m.userId} className="flex items-center justify-between text-sm">
                    <div>
                      <div>{m.name ?? m.email}</div>
                      <div className="text-neutral-500 text-xs">{m.email}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      {isOwner && m.role !== "owner" ? (
                        <>
                          <select
                            value={m.role}
                            onChange={(e) => changeRole(m.userId, e.target.value)}
                            className="text-xs px-2 py-1 border border-neutral-300 rounded"
                          >
                            <option value="editor">Editor</option>
                            <option value="viewer">Viewer</option>
                          </select>
                          <button
                            onClick={() => removeMember(m.userId)}
                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <span className="text-xs px-2 py-1 bg-neutral-100 rounded">{m.role}</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {isOwner && (
              <div className="pt-4 border-t">
                <button
                  onClick={deleteRoom}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete room
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </>
  );
}
