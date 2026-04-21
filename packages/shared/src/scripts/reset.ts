import { required } from "./env";
import { createDb } from "../db/client";
import { auditLog, updateLog, snapshots, roomMembers, rooms, users } from "../db/schema";

async function main() {
  const db = createDb(required("DATABASE_URL"));
  await db.delete(auditLog);
  await db.delete(updateLog);
  await db.delete(snapshots);
  await db.delete(roomMembers);
  await db.delete(rooms);
  await db.delete(users);
  console.log("✓ All data cleared.");
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
