import { ImageResponse } from "next/og";
import { SITE } from "@/lib/site";

/*
 * Gambar OG untuk semua halaman publik. Dibuat lewat ImageResponse supaya ikut
 * locale (judul dalam bahasa yang sesuai) tanpa aset per locale. Ukuran 1200x630
 * adalah rasio yang dipakai semua platform sosial untuk pratinjau tautan.
 */
export const alt = "Siedu - Bimbel TK sampai SMA";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
          background: "linear-gradient(135deg, #0f235f 0%, #1d4ed8 55%, #2563eb 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", fontSize: 28, fontWeight: 600, color: "#bfdbfe", letterSpacing: 2 }}>
          {SITE.nama.toUpperCase()}
        </div>
        <div style={{ display: "flex", marginTop: 24, fontSize: 72, fontWeight: 800, lineHeight: 1.1, maxWidth: 960 }}>
          Bimbingan belajar untuk TK sampai SMA
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 32, color: "#dbeafe", maxWidth: 900 }}>
          Pendaftaran kelas, jadwal, presensi, dan nilai dalam satu tempat
        </div>
      </div>
    ),
    size,
  );
}