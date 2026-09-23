'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { UserPlus } from 'lucide-react';

export function AddChildBentoTile() {
  const t = useTranslations('parent');

  return (
    <Link
      href="/children/new"
      className="group relative flex h-full min-h-[260px] flex-col items-center justify-center rounded-2xl sm:rounded-3xl border-2 border-dashed border-blue-300 bg-white hover:border-brand hover:bg-blue-50 hover:shadow-lg hover:shadow-blue-500/10 hover:-translate-y-1 p-6 sm:p-8 text-center shadow-sm transition-all duration-200 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
    >
      <div className="flex size-14 items-center justify-center rounded-2xl bg-blue-50 text-brand border border-blue-200 shadow-xs transition-all duration-200 group-hover:scale-105 group-hover:bg-brand group-hover:text-white group-hover:border-brand group-hover:shadow-md">
        <UserPlus className="size-6" />
      </div>

      <div className="mt-4 space-y-1.5">
        <h3 className="text-base font-black text-slate-900 group-hover:text-blue-950 transition-colors">
          {t('bentoAddChildTitle')}
        </h3>
        <p className="text-xs text-slate-600 group-hover:text-blue-800 font-medium max-w-[240px] leading-relaxed transition-colors">
          {t('bentoAddChildDesc')}
        </p>
      </div>

      <div className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-brand text-white px-4 py-2 text-xs font-bold shadow-xs group-hover:shadow-md transition-all">
        <span>+ Tambah Anak</span>
      </div>
    </Link>
  );
}
