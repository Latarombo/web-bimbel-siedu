import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { Inter, Plus_Jakarta_Sans, Geist } from "next/font/google";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations } from "next-intl/server";
import "../globals.css";
import "lenis/dist/lenis.css";
import { cn } from "@/lib/utils";
import { isLocale, routing } from "@/i18n/routing";
import SmoothScroll from "@/components/SmoothScroll";

const geistSans = Geist({ subsets: ["latin"], variable: "--font-geist-sans", display: "swap" });

// DESIGN.md: Plus Jakarta Sans = heading (display), Inter = body/label.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"], display: "swap" });
const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"], display: "swap" });

// Alternates/hreflang TIDAK ditulis manual di sini: proxy next-intl sudah
// mengirim header `Link: <...>; rel=alternate; hreflang=...` per halaman
// (alternateLinks default true), yang nilainya mengikuti path aktif.
export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "common" });
  return {
    metadataBase: new URL("https://siedu.id"),
    title: { default: t("meta.title"), template: `%s | ${t("meta.brand")}` },
    description: t("meta.description"),
  };
}

// Namespace yang boleh disuntik ke client. Tambah di sini HANYA saat komponen
// 'use client' benar-benar memanggil useTranslations untuk namespace tsb.
const CLIENT_NAMESPACES = ["common", "chrome", "about", "shared", "auth", "parent", "teacher", "admin", "adminForms", "public"] as const;

// Kedua locale di-render saat build (untuk halaman yang memang statis).
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

// Root layout polos: navbar/footer dipasang per route group
// ((public) LandingNavbar+Footer, (parent)/(teacher) navbar role masing-masing, (auth) tanpa keduanya).
export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const t = await getTranslations({ locale, namespace: "common" });

  // Provider tanpa prop `messages` otomatis menyuntik SEMUA kamus ke bundle
  // client (RSC payload ikut bengkak). Disaring: hanya namespace yang benar-benar
  // dipakai komponen 'use client' (navbar/footer, about/LangkahTabs).
  const all = await getMessages();
  const clientMessages = Object.fromEntries(
    Object.entries(all).filter(([ns]) => (CLIENT_NAMESPACES as readonly string[]).includes(ns)),
  );

  return (
    <html lang={locale} data-scroll-behavior="smooth" className={cn("h-full", "antialiased", inter.variable, jakarta.variable, geistSans.variable)}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SmoothScroll />
        <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 bg-brand text-white px-4 py-2 rounded-lg text-sm">
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider messages={clientMessages}>{children}</NextIntlClientProvider>
      </body>
    </html>
  );
}
