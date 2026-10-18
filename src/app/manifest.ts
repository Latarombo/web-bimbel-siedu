import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Siedu - Bimbel TK-SMA Terintegrasi",
    short_name: "Siedu",
    description:
      "Platform pendaftaran bimbel untuk orang tua: kelola anak, pilih kelas, bayar cicilan, pantau presensi dan nilai real-time.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#2563eb",
    lang: "id",
    categories: ["education"],
    icons: [
      {
        src: "/favicon.ico",
        sizes: "any",
        type: "image/x-icon",
      },
    ],
  };
}