"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Settings, Trash2, UserPlus } from "lucide-react";

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

  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"editor" | "viewer">("editor");
  const [inviteBusy, setInviteBusy] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  async function refreshMembers() {
    const r = await fetch(`/api/rooms/${slug}/members`);
    const d = await r.json();
    setMembers(d.members ?? []);
  }

  useEffect(() => {
    if (open) refreshMembers();
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

  async function inviteMember(e: React.FormEvent) {
    e.preventDefault();
    setInviteBusy(true);
    setInviteMsg(null);
    try {
      const res = await fetch(`/api/rooms/${slug}/members`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim().toLowerCase(), role: inviteRole }),
      });
      if (res.ok) {
        setInviteEmail("");
        setInviteMsg({ kind: "ok", text: "Member added." });
        await refreshMembers();
      } else if (res.status === 404) {
        setInviteMsg({
          kind: "err",
          text: "No user with that email. They must sign in to Canvasly first.",
        });
      } else if (res.status === 403) {
        setInviteMsg({ kind: "err", text: "Only the owner can invite members." });
      } else {
        setInviteMsg({ kind: "err", text: `Failed (${res.status}).` });
      }
    } finally {
      setInviteBusy(false);
    }
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
          <div className="absolute inset-0 bg-black/30" onClick={() => setOpen(false)} />
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
                  <button
                    onClick={saveName}
                    className="px-3 py-2 bg-neutral-900 text-white rounded-md text-sm"
                  >
                    Save
                  </button>
                </div>
              </div>
            )}

            {isOwner && (
              <div>
                <h3 className="text-sm font-medium mb-2 flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" /> Invite member
                </h3>
                <form onSubmit={inviteMember} className="space-y-2">
                  <input
                    type="email"
                    required
                    placeholder="user@example.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-300 rounded-md text-sm"
                  />
                  <div className="flex gap-2">
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as "editor" | "viewer")}
                      className="flex-1 px-3 py-2 border border-neutral-300 rounded-md text-sm"
                    >
                      <option value="editor">Editor</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      type="submit"
                      disabled={inviteBusy || !inviteEmail.trim()}
                      className="px-3 py-2 bg-neutral-900 text-white rounded-md text-sm disabled:opacity-50"
                    >
                      {inviteBusy ? "Adding…" : "Add"}
                    </button>
                  </div>
                  {inviteMsg && (
                    <p
                      className={
                        inviteMsg.kind === "ok"
                          ? "text-xs text-green-700"
                          : "text-xs text-red-600"
                      }
                    >
                      {inviteMsg.text}
                    </p>
                  )}
                  <p className="text-xs text-neutral-500">
                    The user must already have signed in once so their account exists.
                  </p>
                </form>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium mb-2">Members ({members.length})</h3>
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
                <button onClick={deleteRoom} className="text-sm text-red-600 hover:underline">
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
