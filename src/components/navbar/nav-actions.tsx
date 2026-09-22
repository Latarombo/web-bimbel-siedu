'use client';

import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { LanguageSwitcher } from '@/components/language-switcher';

interface NavActionsProps {
  dashboardHref?: string | null;
}

export function NavActions({ dashboardHref = null }: NavActionsProps) {
  const t = useTranslations('chrome.nav');

  return (
    <div className="hidden lg:flex items-center gap-2.5">
      {/* Pengalih Bahasa Toggle (Opsi A: Minimalist Compact Pill, height 32px) */}
      <div className="border-r border-slate-200/80 pr-2.5 mr-0.5">
        <LanguageSwitcher variant="toggle" />
      </div>

      {/* Auth Action Buttons (Seragam height 32px / h-8) */}
      {dashboardHref ? (
        <Link
          href={dashboardHref}
          className="inline-flex h-8 items-center px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-all duration-200 hover:shadow active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none cursor-pointer"
        >
          {t('dashboard')}
        </Link>
      ) : (
        <div className="flex items-center gap-1.5">
          <Link
            href="/login"
            className="inline-flex h-8 items-center px-3.5 text-xs font-semibold text-slate-700 hover:text-blue-700 hover:bg-slate-100/70 rounded-lg transition-all duration-200 focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none cursor-pointer"
          >
            {t('login')}
          </Link>
          <Link
            href="/register"
            className="inline-flex h-8 items-center justify-center px-4 text-xs font-bold text-white rounded-lg shadow-xs transition-all duration-200 hover:brightness-95 hover:shadow active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none cursor-pointer"
            style={{ backgroundColor: '#f26d0f' }}
          >
            {t('signup')}
          </Link>
        </div>
      )}
    </div>
  );
}
