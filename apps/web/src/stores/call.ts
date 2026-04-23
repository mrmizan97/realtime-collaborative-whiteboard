"use client";
import { create } from "zustand";

export type CallKind = "audio" | "video";

type PeerMedia = {
  clientId: number;
  stream: MediaStream;
  hasAudio: boolean;
  hasVideo: boolean;
};

type State = {
  active: boolean;
  kind: CallKind | null;
  muted: boolean;
  cameraOff: boolean;
  localStream: MediaStream | null;
  peerStreams: Map<number, PeerMedia>;
  setActive: (kind: CallKind | null, stream: MediaStream | null) => void;
  toggleMute: () => void;
  toggleCamera: () => void;
  setPeerStream: (id: number, stream: MediaStream) => void;
  removePeer: (id: number) => void;
  reset: () => void;
};

export const useCallStore = create<State>((set) => ({
  active: false,
  kind: null,
  muted: false,
  cameraOff: false,
  localStream: null,
  peerStreams: new Map(),
  setActive: (kind, stream) =>
    set({ active: kind !== null, kind, localStream: stream, muted: false, cameraOff: false }),
  toggleMute: () =>
    set((s) => {
      const next = !s.muted;
      if (s.localStream) {
        for (const t of s.localStream.getAudioTracks()) t.enabled = !next;
      }
      return { muted: next };
    }),
  toggleCamera: () =>
    set((s) => {
      const next = !s.cameraOff;
      if (s.localStream) {
        for (const t of s.localStream.getVideoTracks()) t.enabled = !next;
      }
      return { cameraOff: next };
    }),
  setPeerStream: (id, stream) =>
    set((s) => {
      const next = new Map(s.peerStreams);
      next.set(id, {
        clientId: id,
        stream,
        hasAudio: stream.getAudioTracks().length > 0,
        hasVideo: stream.getVideoTracks().length > 0,
      });
      return { peerStreams: next };
    }),
  removePeer: (id) =>
    set((s) => {
      const next = new Map(s.peerStreams);
      next.delete(id);
      return { peerStreams: next };
    }),
  reset: () =>
    set({
      active: false,
      kind: null,
      muted: false,
      cameraOff: false,
      localStream: null,
      peerStreams: new Map(),
    }),
}));
