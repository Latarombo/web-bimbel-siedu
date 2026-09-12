import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });

// DESIGN.md: Plus Jakarta Sans = heading (display), Inter = body/label.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Siedu \u2014 Bimbel TK\u2013SMA Terintegrasi", template: "%s | Siedu" },
  description: "Platform pendaftaran bimbel untuk orang tua: kelola anak, pilih kelas, bayar cicilan, pantau presensi & nilai real-time.",
  metadataBase: new URL("https://siedu.id"),
};

// Root layout polos: navbar/footer dipasang per route group
// ((public) LandingNavbar+Footer, (parent)/(teacher) navbar role masing-masing, (auth) tanpa keduanya).
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={cn("h-full", "antialiased", inter.variable, jakarta.variable, geistSans.variable)}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-brand text-white px-4 py-2 rounded-full text-sm">
          Lompat ke konten
        </a>
        {children}
      </body>
    </html>
  );
}
