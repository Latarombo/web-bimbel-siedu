import { isLocale, routing } from './routing';

/**
 * Pengganti lib/get-lang.ts.
 *
 * Nama fungsi dipilih `getLocaleAktif`, BUKAN `getLocale`, karena next-intl
 * sudah meng-ekspor `getLocale` dari 'next-intl/server' — impor terselubung
 * dari server action (next/headers) membuat rute opt-out dari static rendering.
 */

/** Server Component / util server-side: baca dari segmen [locale]. */
export async function getLocaleAktif(): Promise<(typeof routing.locales)[number]> {
  const { locale } = await import('next/root-params');
  let raw = '';
  try {
    raw = await locale();
  } catch {
    return routing.defaultLocale;
  }
  return isLocale(raw) ? raw : routing.defaultLocale;
}

/**
 * Server Action / Route Handler: `next/root-params` TIDAK tersedia di sana,
 * jadi bahasa dibaca dari cookie NEXT_LOCALE yang disinkronkan proxy next-intl.
 * Dipakai untuk pesan error validasi agar ikut bahasa user.
 */
export async function getLocaleDariCookie(): Promise<(typeof routing.locales)[number]> {
  const { cookies } = await import('next/headers');
  const raw = (await cookies()).get('NEXT_LOCALE')?.value ?? '';
  return isLocale(raw) ? raw : routing.defaultLocale;
}
