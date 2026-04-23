"use client";
import type { WebsocketProvider } from "y-websocket";
import { useCallStore } from "@/stores/call";
import { sendSignal, signalId, subscribeSignals, type Signal } from "./signaling";

const ICE_SERVERS: RTCIceServer[] = [{ urls: "stun:stun.l.google.com:19302" }];

export class Mesh {
  private peers = new Map<number, RTCPeerConnection>();
  private unsubscribeSignals: (() => void) | null = null;
  private stopped = false;

  constructor(
    private ws: WebsocketProvider,
    private localStream: MediaStream,
  ) {}

  start() {
    this.unsubscribeSignals = subscribeSignals(this.ws, (s) => this.onSignal(s));
    // Offer to every existing peer
    const states = this.ws.awareness.getStates();
    const my = this.ws.awareness.clientID;
    states.forEach((_v, clientId) => {
      if (clientId === my) return;
      if (clientId < my) return; // avoid glare: lower id initiates
      this.createOffer(clientId);
    });
  }

  stop() {
    this.stopped = true;
    this.unsubscribeSignals?.();
    for (const [id, pc] of this.peers) {
      pc.close();
      useCallStore.getState().removePeer(id);
    }
    this.peers.clear();
  }

  private getOrCreate(id: number): RTCPeerConnection {
    let pc = this.peers.get(id);
    if (pc) return pc;
    pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

    for (const track of this.localStream.getTracks()) {
      pc.addTrack(track, this.localStream);
    }

    pc.onicecandidate = (e) => {
      if (!e.candidate) return;
      sendSignal(this.ws, {
        id: signalId(),
        to: id,
        kind: "candidate",
        data: e.candidate.toJSON(),
      });
    };

    pc.ontrack = (e) => {
      const [stream] = e.streams;
      if (stream) useCallStore.getState().setPeerStream(id, stream);
    };

    pc.onconnectionstatechange = () => {
      if (!pc) return;
      if (["disconnected", "failed", "closed"].includes(pc.connectionState)) {
        useCallStore.getState().removePeer(id);
      }
    };

    this.peers.set(id, pc);
    return pc;
  }

  private async createOffer(id: number) {
    const pc = this.getOrCreate(id);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);
    sendSignal(this.ws, {
      id: signalId(),
      to: id,
      kind: "offer",
      data: offer,
    });
  }

  private async onSignal(s: Signal) {
    if (this.stopped) return;
    const pc = this.getOrCreate(s.from);
    if (s.kind === "offer") {
      await pc.setRemoteDescription(s.data as RTCSessionDescriptionInit);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      sendSignal(this.ws, {
        id: signalId(),
        to: s.from,
        kind: "answer",
        data: answer,
      });
    } else if (s.kind === "answer") {
      await pc.setRemoteDescription(s.data as RTCSessionDescriptionInit);
    } else if (s.kind === "candidate") {
      try {
        await pc.addIceCandidate(s.data as RTCIceCandidateInit);
      } catch {
        /* ignore late / duplicate candidates */
      }
    } else if (s.kind === "bye") {
      pc.close();
      this.peers.delete(s.from);
      useCallStore.getState().removePeer(s.from);
    }
  }

  announceBye() {
    const my = this.ws.awareness.clientID;
    const states = this.ws.awareness.getStates();
    states.forEach((_v, clientId) => {
      if (clientId === my) return;
      sendSignal(this.ws, {
        id: signalId(),
        to: clientId,
        kind: "bye",
        data: null,
      });
    });
  }
}

export async function getLocalMedia(kind: "audio" | "video"): Promise<MediaStream> {
  return navigator.mediaDevices.getUserMedia({
    audio: true,
    video: kind === "video" ? { width: 320, height: 240 } : false,
  });
}
