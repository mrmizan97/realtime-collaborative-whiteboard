import "server-only";
import { createDb } from "@canvasly/shared";
import { env } from "@/env";

declare global {
  // eslint-disable-next-line no-var
  var __db: ReturnType<typeof createDb> | undefined;
}

export const db = globalThis.__db ?? createDb(env.DATABASE_URL());
if (process.env.NODE_ENV !== "production") globalThis.__db = db;
