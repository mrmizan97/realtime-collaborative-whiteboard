import { SignJWT, jwtVerify } from "jose";
import type { RealtimeJwtClaims } from "./types/index";

const ISSUER = "canvasly";
const AUDIENCE = "canvasly-realtime";

export async function signRealtimeToken(
  secret: string,
  claims: { sub: string; room: string; role: "owner" | "editor" | "viewer" },
  ttlSeconds = 60,
): Promise<{ token: string; expiresAt: number }> {
  const key = new TextEncoder().encode(secret);
  const now = Math.floor(Date.now() / 1000);
  const exp = now + ttlSeconds;
  const token = await new SignJWT({ role: claims.role, room: claims.room })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setSubject(claims.sub)
    .setIssuedAt(now)
    .setExpirationTime(exp)
    .sign(key);
  return { token, expiresAt: exp * 1000 };
}

export async function verifyRealtimeToken(
  secret: string,
  token: string,
): Promise<RealtimeJwtClaims> {
  const key = new TextEncoder().encode(secret);
  const { payload } = await jwtVerify(token, key, {
    issuer: ISSUER,
    audience: AUDIENCE,
  });
  return payload as RealtimeJwtClaims;
}
