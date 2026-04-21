import { z } from "zod";

export const visibility = z.enum(["private", "unlisted", "public"]);
export const role = z.enum(["owner", "editor", "viewer"]);

export const createRoomInput = z.object({
  name: z.string().trim().min(1).max(120),
});

export const updateRoomInput = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  visibility: visibility.optional(),
});

export const roomDto = z.object({
  id: z.string().uuid(),
  slug: z.string(),
  name: z.string(),
  role: role,
  visibility: visibility,
  lastOpenedAt: z.string().datetime().nullable(),
  memberCount: z.number().int().nonnegative(),
  thumbnailUrl: z.string().url().nullable(),
});

export type CreateRoomInput = z.infer<typeof createRoomInput>;
export type UpdateRoomInput = z.infer<typeof updateRoomInput>;
export type RoomDto = z.infer<typeof roomDto>;

export const tokenResponse = z.object({
  token: z.string(),
  expiresAt: z.number(),
});
export type TokenResponse = z.infer<typeof tokenResponse>;
