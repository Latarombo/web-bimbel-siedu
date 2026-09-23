'use client';

import { useState, useEffect, useCallback } from 'react';
import { useLocale } from 'next-intl';
import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { routing, type Locale } from '@/i18n/routing';
import { Languages, Globe, ChevronDown, Check } from 'lucide-react';

/**
 * Dropdown ganti bahasa ala next-intl resmi: Link dengan prop `locale`
 * (navigation API) memindahkan user ke path yang sama dalam locale lain —
 * soft navigation, tanpa reload penuh, tanpa menulis cookie manual
 * (NEXT_LOCALE disinkronkan proxy).
 */
export function LanguageSwitcher({
  placement = 'top',
  compact = false,
  variant = 'default',
  align = 'left',
}: {
  placement?: 'top' | 'bottom';
  compact?: boolean;
  variant?: 'default' | 'auth' | 'toggle';
  align?: 'left' | 'right';
}) {
  const [open, setOpen] = useState(false);
  const [suffix, setSuffix] = useState('');
  const locale = useLocale();
  const [activeLocale, setActiveLocale] = useState(locale);
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations('chrome.switcher');
  const others = routing.locales.filter((l) => l !== locale);
  const all: Locale[] = [locale as Locale, ...others];

  const refreshSuffix = useCallback(() => {
    if (typeof window !== 'undefined') {
      const current = window.location.search + window.location.hash;
      setSuffix(current);
      return current;
    }
    return '';
  }, []);

  const [prevLocale, setPrevLocale] = useState(locale);
  if (locale !== prevLocale) {
    setPrevLocale(locale);
    setActiveLocale(locale);
  }

  useEffect(() => {
    queueMicrotask(() => {
      refreshSuffix();
    });
    window.addEventListener('popstate', refreshSuffix);
    window.addEventListener('hashchange', refreshSuffix);
    return () => {
      window.removeEventListener('popstate', refreshSuffix);
      window.removeEventListener('hashchange', refreshSuffix);
    };
  }, [refreshSuffix]);

  const handleLocaleChange = (targetLocale: Locale) => {
    if (activeLocale === targetLocale) return;
    const latestSuffix = typeof window !== 'undefined'
      ? (window.location.search + window.location.hash)
      : suffix;
    setActiveLocale(targetLocale);
    router.replace(pathname + latestSuffix, { locale: targetLocale, scroll: false });
  };

  // Segmented iOS / macOS Glass Pill (Clean, symmetrical, white floating thumb with micro-shadow)
  if (variant === 'auth' || variant === 'toggle') {
    return (
      <div
        role="group"
        aria-label="Pilih bahasa / Select language"
        onMouseEnter={refreshSuffix}
        onTouchStart={refreshSuffix}
        className="relative inline-flex h-7.5 w-[76px] items-center rounded-lg bg-slate-100/90 p-0.5 select-none"
      >
        {/* iOS-style Floating White Thumb */}
        <div
          aria-hidden="true"
          className={`absolute top-0.5 bottom-0.5 left-0.5 w-[calc(50%-2px)] rounded-md bg-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] ring-1 ring-black/5 transition-transform duration-200 ease-out pointer-events-none ${
            activeLocale === 'id' ? 'translate-x-0' : 'translate-x-full'
          }`}
        />

        {/* Tombol ID */}
        <button
          type="button"
          aria-pressed={activeLocale === 'id'}
          onClick={() => handleLocaleChange('id')}
          className={`relative z-10 flex h-full flex-1 items-center justify-center text-[11px] tracking-wide transition-colors duration-150 cursor-pointer ${
            activeLocale === 'id'
              ? 'font-bold text-slate-900'
              : 'font-medium text-slate-500 hover:text-slate-700'
          }`}
        >
          ID
        </button>

        {/* Tombol EN */}
        <button
          type="button"
          aria-pressed={activeLocale === 'en'}
          onClick={() => handleLocaleChange('en')}
          className={`relative z-10 flex h-full flex-1 items-center justify-center text-[11px] tracking-wide transition-colors duration-150 cursor-pointer ${
            activeLocale === 'en'
              ? 'font-bold text-slate-900'
              : 'font-medium text-slate-500 hover:text-slate-700'
          }`}
        >
          EN
        </button>
      </div>
    );
  }

  const menuClasses = `absolute ${
    placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
  } ${
    align === 'right' ? 'right-0' : 'left-0'
  } z-30 min-w-48 rounded-xl border border-gray-200 bg-white py-1 shadow-lg`;

  return (
    <div className="relative inline-block text-left">
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
        className="relative z-20 flex items-center space-x-1.5 text-gray-700 hover:text-gray-900 transition-colors duration-200 cursor-pointer"
      >
        <Languages className="w-4 h-4 shrink-0 stroke-[1.8]" />
        <span className="text-sm font-medium">
          {compact ? locale.toUpperCase() : t(locale)}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform duration-200 ${
            open ? 'rotate-180 text-blue-600' : ''
          }`}
        />
      </button>

      {open && (
        <ul role="listbox" aria-label={t('listAria')} className={menuClasses}>
          {all.map((l) => (
            <li key={l} role="none">
              <button
                type="button"
                role="option"
                aria-selected={l === locale}
                onClick={() => {
                  setOpen(false);
                  handleLocaleChange(l);
                }}
                className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors cursor-pointer ${
                  l === locale
                    ? 'font-semibold text-blue-600'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Languages className="w-3.5 h-3.5 opacity-60" />
                  <span>{t(l)}</span>
                </div>
                {l === locale && (
                  <Check className="w-4 h-4 text-blue-600 stroke-[2.5]" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
