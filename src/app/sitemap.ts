import type { MetadataRoute } from "next";
import { routing } from "@/i18n/routing";
import { kelasAktifPublik } from "@/lib/kelas";

/*
 * Sitemap hanya memuat halaman yang boleh diindeks: landing publik + katalog
 * kelas aktif. Route group (parent)/(teacher)/(admin) TIDAK ikut, isinya data
 * pribadi di balik auth dan robots.txt juga memblokirnya. URL auth
 * (/login, /register, ...) sengaja tidak ada, tidak ada nilai SEO-nya.
 *
 * localePrefix 'as-needed' berarti id tanpa prefix, en memakai /en/...
 */
const BASE = "https://siedu.id";

type SitemapEntry = MetadataRoute.Sitemap[number];

/** Halaman statis publik beserta prioritas dan frekuensi perubahannya. */
const STATIS: { path: string; priority: number; changeFrequency: SitemapEntry["changeFrequency"] }[] = [
  { path: "", priority: 1, changeFrequency: "weekly" },
  { path: "/classes", priority: 0.9, changeFrequency: "daily" },
  { path: "/about", priority: 0.7, changeFrequency: "monthly" },
  { path: "/contact", priority: 0.6, changeFrequency: "monthly" },
  { path: "/privacy-policy", priority: 0.2, changeFrequency: "yearly" },
  { path: "/terms", priority: 0.2, changeFrequency: "yearly" },
];

function urlUntuk(path: string, locale: string): string {
  return `${BASE}${locale === routing.defaultLocale ? path : `/${locale}${path}`}`;
}

/** URL untuk locale lain pada path yang sama, untuk tag hreflang. */
function alternates(path: string) {
  return {
    languages: Object.fromEntries(
      routing.locales.map((locale) => [locale, urlUntuk(path, locale)]),
    ),
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const statis = STATIS.flatMap(({ path, priority, changeFrequency }) =>
    routing.locales.map((locale) => ({
      url: urlUntuk(path, locale),
      lastModified: now,
      changeFrequency,
      priority,
      alternates: alternates(path),
    })),
  );

  // Detail kelas ikut diindeks karena bisa dicari lewat nama mapel. Query gagal
  // tidak boleh menggagalkan seluruh sitemap, jadi ditangkapi.
  let kelas: SitemapEntry[] = [];
  try {
    const rows = await kelasAktifPublik();
    kelas = rows.flatMap((row) => {
      const path = `/classes/${row.id}`;
      return routing.locales.map((locale) => ({
        url: urlUntuk(path, locale),
        lastModified: now,
        changeFrequency: "weekly" as const,
        priority: 0.8,
        alternates: alternates(path),
      }));
    });
  } catch {
    // DB tidak terjangkau saat build: tetap hasilkan sitemap halaman statis.
  }

  return [...statis, ...kelas];
}