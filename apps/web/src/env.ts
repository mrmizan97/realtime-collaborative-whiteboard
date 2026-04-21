function req(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export const env = {
  DATABASE_URL: () => req("DATABASE_URL"),
  JWT_SECRET: () => req("JWT_SECRET"),
  NEXTAUTH_SECRET: () => req("NEXTAUTH_SECRET"),
  REALTIME_URL: () => process.env.NEXT_PUBLIC_REALTIME_URL ?? "ws://localhost:4000",
};
