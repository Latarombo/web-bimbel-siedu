import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Dev-only: izinkan akses HMR dari IP jaringan Windows (agent-browser dari WSL
  // membuka host ini; tanpa ini resource /_next/* diblokir dan hydration mati).
  allowedDevOrigins: ["10.230.65.145", "192.168.96.1", "localhost"],
};

export default nextConfig;
