"use client";
import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/Dialog";
import { Share2, Check, Copy } from "lucide-react";
import type { Visibility } from "@canvasly/shared";

export function ShareDialog({ slug, initialVisibility }: { slug: string; initialVisibility: Visibility }) {
  const [open, setOpen] = useState(false);
  const [visibility, setVisibility] = useState<Visibility>(initialVisibility);
  const [copied, setCopied] = useState(false);

  const url = typeof window !== "undefined" ? `${window.location.origin}/r/${slug}` : `/r/${slug}`;

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  async function saveVisibility(v: Visibility) {
    setVisibility(v);
    await fetch(`/api/rooms/${slug}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ visibility: v }),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        onClick={() => setOpen(true)}
        className="px-2.5 py-1 border border-neutral-300 rounded-md text-sm flex items-center gap-1.5 bg-white"
      >
        <Share2 className="w-3.5 h-3.5" /> Share
      </button>
      <DialogContent title="Share room">
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-neutral-700">Link</label>
            <div className="flex mt-1.5">
              <input
                readOnly
                value={url}
                className="flex-1 px-3 py-2 border border-neutral-300 rounded-l-md text-sm bg-neutral-50"
              />
              <button
                onClick={copy}
                className="px-3 py-2 border border-l-0 border-neutral-300 rounded-r-md text-sm hover:bg-neutral-50"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-neutral-700">Visibility</label>
            <select
              value={visibility}
              onChange={(e) => saveVisibility(e.target.value as Visibility)}
              className="w-full mt-1.5 px-3 py-2 border border-neutral-300 rounded-md text-sm"
            >
              <option value="private">Private — members only</option>
              <option value="unlisted">Unlisted — anyone with the link</option>
              <option value="public">Public — anyone can view</option>
            </select>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
