import { routing } from "@/i18n/routing";

/**
 * Pembantu metadata bersama untuk halaman publik.
 *
 * `canonical` wajib ada di setiap halaman yang boleh diindeks supaya mesin
 * pencari tidak menganggap /about dan /en/about sebagai dua URL berbeda untuk
 * konten yang sama. `localePrefix`.next-intl masih 'as-needed', jadi id tidak
 * memakai prefix.
 */
export const SITE_URL = "https://siedu.id";

export function canonical(path: string): string {
  return `${SITE_URL}${path}`;
}

/**
 * Metadata standar untuk halaman publik: judul, deskripsi, canonical, dan
 * OpenGraph/Twitter yang konsisten. Judul tetap memakai template dari layout
 * (`%s | Siedu`), jadi pemanggil cukup mengoper judul tanpa nama brand.
 */
export function publicMetadata({ title, description, path }: { title: string; description: string; path: string }) {
  const url = canonical(path);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website" as const,
      url,
      title,
      description,
    },
    twitter: {
      card: "summary_large_image" as const,
      title,
      description,
    },
  };
}

/** URL untuk locale lain pada path yang sama. */
export function localizedPath(path: string, locale: string): string {
  return locale === routing.defaultLocale ? path : `/${locale}${path}`;
}