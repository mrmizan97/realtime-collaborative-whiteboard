import { verifyRealtimeToken } from "@canvasly/shared";
import type { RealtimeJwtClaims } from "@canvasly/shared";

const JWT_SECRET = process.env.JWT_SECRET ?? "dev-secret-change-me";

export async function verifyToken(token: string | undefined): Promise<RealtimeJwtClaims | null> {
  if (!token) return null;
  try {
    return await verifyRealtimeToken(JWT_SECRET, token);
  } catch {
    return null;
  }
}
