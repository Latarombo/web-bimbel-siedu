import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Alias `next-intl/config` -> src/i18n/request.ts (dibaca next-intl saat render).
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Dev-only: izinkan akses HMR dari IP jaringan Windows (agent-browser dari WSL
  // membuka host ini; tanpa ini resource /_next/* diblokir dan hydration mati).
  allowedDevOrigins: ["10.230.65.145", "192.168.96.1", "localhost"],
};

export default withNextIntl(nextConfig);
