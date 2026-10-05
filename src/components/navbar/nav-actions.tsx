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

      {/* Auth Action Button (Seragam height 32px / h-8) */}
      <Link
        href={dashboardHref ?? '/login'}
        className="inline-flex h-8 items-center justify-center px-4 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-all duration-200 hover:shadow active:scale-[0.98] focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none cursor-pointer"
      >
        {dashboardHref ? t('dashboard') : t('login')}
      </Link>
    </div>
  );
}
