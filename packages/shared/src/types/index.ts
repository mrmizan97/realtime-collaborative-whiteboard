export type AwarenessState = {
  user: { id: string; name: string; avatarUrl?: string; color: string };
  cursor: { x: number; y: number } | null;
  selection: string[];
  viewing: boolean;
};

export type RealtimeJwtClaims = {
  sub: string;
  room: string;
  role: "owner" | "editor" | "viewer";
  iat: number;
  exp: number;
};
