/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: { typedRoutes: true },
  transpilePackages: ["@canvasly/shared"],
  env: {
    NEXT_PUBLIC_DEV_CREDENTIALS_LOGIN: process.env.DEV_CREDENTIALS_LOGIN ?? "false",
  },
};

export default nextConfig;
