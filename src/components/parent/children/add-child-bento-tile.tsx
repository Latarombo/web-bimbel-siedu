'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { UserPlus } from 'lucide-react';

export function AddChildBentoTile() {
  const t = useTranslations('parent');

  return (
    <Link
      href="/children/new"
      className="group relative flex min-h-[220px] flex-col items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-dashed border-slate-200 bg-white/60 p-6 text-center shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/60 hover:bg-blue-50/20 hover:shadow-sm active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <div className="flex size-12 items-center justify-center rounded-2xl bg-blue-50 text-brand border border-blue-100 shadow-2xs transition-transform duration-200 group-hover:scale-110 group-hover:bg-brand group-hover:text-white">
        <UserPlus className="size-5" />
      </div>

      <div className="mt-3.5 space-y-1">
        <h3 className="text-base font-bold text-slate-800 group-hover:text-brand transition-colors">
          {t('bentoAddChildTitle')}
        </h3>
        <p className="text-xs text-slate-500 max-w-[240px] leading-relaxed">
          {t('bentoAddChildDesc')}
        </p>
      </div>
    </Link>
  );
}
