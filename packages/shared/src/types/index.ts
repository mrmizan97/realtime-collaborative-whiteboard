export type AwarenessState = {
  user: { id: string; name: string; avatarUrl?: string; color: string };
  cursor: { x: number; y: number } | null;
  selection: string[];
  viewing: boolean;
  viewport?: { x: number; y: number; zoom: number };
  reaction?: { emoji: string; x: number; y: number; at: number };
};

export type RealtimeJwtClaims = {
  sub: string;
  room: string;
  role: "owner" | "editor" | "viewer";
  iat: number;
  exp: number;
};
