import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/LandingNavbar";
import Footer from "@/components/Footer";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap" });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: { default: "Siedu \u2014 Bimbel TK\u2013SMA Terintegrasi", template: "%s | Siedu" },
  description: "Platform pendaftaran bimbel untuk orang tua: kelola anak, pilih kelas, bayar cicilan, pantau presensi & nilai real-time.",
  metadataBase: new URL("https://siedu.id"),
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-brand text-white px-4 py-2 rounded-full text-sm">
          Lompat ke konten
        </a>
        <Navbar />
        <main id="main" className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
