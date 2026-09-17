import { defineRouting } from 'next-intl/routing';

/**
 * Dua bahasa saja: id (default, tanpa prefix URL) dan en (/en/...).
 * mode 'as-needed' dipilih supaya seluruh URL lama (/classes, /admin/dashboard)
 * tetap hidup. Matcher src/proxy.ts harus mencakup semua halaman untuk rewrite locale.
 */
export const routing = defineRouting({
  locales: ['id', 'en'],
  defaultLocale: 'id',
  localePrefix: 'as-needed',
  localeCookie: { maxAge: 60 * 60 * 24 * 365 },
});

export type Locale = (typeof routing.locales)[number];

/** Guard locale dari URL: nilai tak dikenal -> 404, bukan crash runtime. */
export function isLocale(value: string): value is Locale {
  return (routing.locales as readonly string[]).includes(value);
}
