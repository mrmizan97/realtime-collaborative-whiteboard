import "dotenv/config";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Also load the repo-root .env if present (monorepo runs scripts from package dir).
try {
  const rootEnv = resolve(process.cwd(), "../../.env");
  const content = readFileSync(rootEnv, "utf8");
  for (const line of content.split("\n")) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/i);
    if (!m) continue;
    const [, key, rawVal] = m;
    if (!key || process.env[key]) continue;
    let v = rawVal ?? "";
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) {
      v = v.slice(1, -1);
    }
    process.env[key] = v;
  }
} catch {
  /* ignore */
}

export function required(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}
