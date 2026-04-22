/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typedRoutes: true,
  transpilePackages: ["@canvasly/shared"],
  env: {
    NEXT_PUBLIC_DEV_CREDENTIALS_LOGIN: process.env.DEV_CREDENTIALS_LOGIN ?? "false",
    NEXT_PUBLIC_GOOGLE_LOGIN:
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? "true" : "false",
  },
};

export default nextConfig;
