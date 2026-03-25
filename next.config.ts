import type { NextConfig } from "next";

const withPWA = require("next-pwa")({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: false,
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Allow ngrok for development hot reloading and manifest access
  // @ts-ignore - Next 16 internal/experimental property recommended in terminal output
  allowedDevOrigins: ["*.ngrok-free.app"],
  // Silence Turbopack warning about webpack config and fix root directory
  turbopack: {
    root: __dirname,
  },
};

export default withPWA(nextConfig);