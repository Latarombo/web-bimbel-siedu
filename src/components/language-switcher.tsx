'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

/**
 * Dropdown ganti bahasa ala next-intl resmi: Link dengan prop `locale`
 * (navigation API) memindahkan user ke path yang sama dalam locale lain —
 * soft navigation, tanpa reload penuh, tanpa menulis cookie manual
 * (NEXT_LOCALE disinkronkan proxy).
 */
export function LanguageSwitcher({ placement = 'top', compact = false }: { placement?: 'top' | 'bottom'; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  const [suffix, setSuffix] = useState('');
  const locale = useLocale();
  const pathname = usePathname();
  const t = useTranslations('chrome.switcher');
  const others = routing.locales.filter((l) => l !== locale);
  // Toggle selalu menampilkan bahasa AKTIF; daftar isi aktif (check) + lainnya.
  const all = [locale, ...others];

  return (
    <div className="relative">
      {open && (
        <button
          type="button"
          aria-hidden="true"
          tabIndex={-1}
          className="fixed inset-0 z-10 cursor-default"
          onClick={() => setOpen(false)}
        />
      )}
      <button
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={t('label')}
        onClick={() => {
          setSuffix(window.location.search + window.location.hash);
          setOpen((v) => !v);
        }}
        className="relative z-20 flex items-center space-x-1.5 text-gray-700 hover:text-gray-900 transition-colors duration-200"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9 9 0 100-18 9 9 0 000 18zm0-18c2.5 2.5 2.5 15.5 0 18m0-18c-2.5 2.5-2.5 15.5 0 18M3.5 9h17M3.5 15h17" />
        </svg>
        <span className="text-sm font-medium">{compact ? locale.toUpperCase() : t(locale)}</span>
        <svg className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul role="listbox" aria-label={t('listAria')} className={`absolute ${placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'} left-0 z-30 min-w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg`}>
          {all.map((l) => (
            <li key={l} role="option" aria-selected={l === locale}>
              <Link
                href={pathname + suffix}
                scroll={false}
                locale={l}
                onClick={() => setOpen(false)}
                className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors ${l === locale ? 'font-semibold text-blue-600' : 'text-gray-700 hover:bg-gray-50'}`}
              >
                {t(l)}
                {l === locale && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
