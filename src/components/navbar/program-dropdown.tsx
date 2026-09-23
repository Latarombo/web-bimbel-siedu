'use client';

import React, { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { ChevronDown, ArrowRight } from 'lucide-react';

interface ProgramDropdownProps {
  isActive: boolean;
  locale?: string;
}

interface ProgramContentProps {
  t: (key: string) => string;
  onClose: () => void;
}

const ProgramContent = ({ t, onClose }: ProgramContentProps) => {
  return (
    <div className="w-[560px] p-6 sm:p-7 select-none">
      {/* 3 Kolom Sesuai Referensi Screenshot */}
      <div className="grid grid-cols-3 gap-8">
        {/* Kolom 1: Jenjang Dasar */}
        <div>
          <h4 className="text-sm font-bold text-slate-900 mb-3.5 tracking-tight">
            {t('primaryLevel')}
          </h4>
          <ul className="space-y-2.5">
            <li>
              <Link
                href="/classes?jenjang=TK"
                onClick={onClose}
                className="block text-xs sm:text-[13px] text-slate-500 hover:text-blue-600 transition-colors leading-relaxed"
              >
                {t('kindergarten')}
              </Link>
            </li>
            <li>
              <Link
                href="/classes?jenjang=SD&tingkat=Kelas+1"
                onClick={onClose}
                className="block text-xs sm:text-[13px] text-slate-500 hover:text-blue-600 transition-colors leading-relaxed"
              >
                {t('elementaryLow')}
              </Link>
            </li>
            <li>
              <Link
                href="/classes?jenjang=SD&tingkat=Kelas+4"
                onClick={onClose}
                className="block text-xs sm:text-[13px] text-slate-500 hover:text-blue-600 transition-colors leading-relaxed"
              >
                {t('elementaryHigh')}
              </Link>
            </li>
            <li>
              <Link
                href="/classes?jenjang=SD"
                onClick={onClose}
                className="block text-xs sm:text-[13px] text-slate-500 hover:text-blue-600 transition-colors leading-relaxed"
              >
                {t('calistungMath')}
              </Link>
            </li>
          </ul>
        </div>

        {/* Kolom 2: Jenjang Menengah */}
        <div>
          <h4 className="text-sm font-bold text-slate-900 mb-3.5 tracking-tight">
            {t('secondaryLevel')}
          </h4>
          <ul className="space-y-2.5">
            <li>
              <Link
                href="/classes?jenjang=SMP"
                onClick={onClose}
                className="block text-xs sm:text-[13px] text-slate-500 hover:text-blue-600 transition-colors leading-relaxed"
              >
                {t('juniorHigh')}
              </Link>
            </li>
            <li>
              <Link
                href="/classes?jenjang=SMA"
                onClick={onClose}
                className="block text-xs sm:text-[13px] text-slate-500 hover:text-blue-600 transition-colors leading-relaxed"
              >
                {t('seniorHigh')}
              </Link>
            </li>
            <li>
              <Link
                href="/classes?jenjang=SMP"
                onClick={onClose}
                className="block text-xs sm:text-[13px] text-slate-500 hover:text-blue-600 transition-colors leading-relaxed"
              >
                {t('schoolExamPrep')}
              </Link>
            </li>
            <li>
              <Link
                href="/classes?jenjang=SMA"
                onClick={onClose}
                className="block text-xs sm:text-[13px] text-slate-500 hover:text-blue-600 transition-colors leading-relaxed"
              >
                {t('utbkPrep')}
              </Link>
            </li>
          </ul>
        </div>

        {/* Kolom 3: Layanan Belajar */}
        <div>
          <h4 className="text-sm font-bold text-slate-900 mb-3.5 tracking-tight">
            {t('servicesLevel')}
          </h4>
          <ul className="space-y-2.5">
            <li>
              <Link
                href="/classes"
                onClick={onClose}
                className="block text-xs sm:text-[13px] text-slate-500 hover:text-blue-600 transition-colors leading-relaxed"
              >
                {t('homeworkHelp')}
              </Link>
            </li>
            <li>
              <Link
                href="/classes"
                onClick={onClose}
                className="block text-xs sm:text-[13px] text-slate-500 hover:text-blue-600 transition-colors leading-relaxed"
              >
                {t('printedModules')}
              </Link>
            </li>
            <li>
              <Link
                href="/classes"
                onClick={onClose}
                className="block text-xs sm:text-[13px] text-slate-500 hover:text-blue-600 transition-colors leading-relaxed"
              >
                {t('periodicTryouts')}
              </Link>
            </li>
            <li>
              <Link
                href="/classes"
                onClick={onClose}
                className="block text-xs sm:text-[13px] text-slate-500 hover:text-blue-600 transition-colors leading-relaxed"
              >
                {t('consultRemedial')}
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Link Pojok Kanan Bawah: View more -> */}
      <div className="mt-6 pt-3 flex justify-end">
        <Link
          href="/classes"
          onClick={onClose}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-blue-600 hover:text-blue-700 hover:gap-2 transition-all duration-150 group"
        >
          <span>{t('viewMore')}</span>
          <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
};

export function ProgramDropdown({ isActive }: ProgramDropdownProps) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('chrome.nav');

  const showFlyout = open;

  return (
    <div
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      className="relative w-fit h-fit"
    >
      {/* Trigger Link dengan Chevron */}
      <Link
        href="/classes"
        aria-current={isActive ? 'page' : undefined}
        onClick={() => setOpen(false)}
        className={`group relative inline-flex h-8 items-center gap-1.5 px-3.5 text-xs font-semibold rounded-full transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
          isActive
            ? 'bg-blue-600/10 text-blue-700 font-bold'
            : showFlyout
            ? 'bg-slate-100/80 text-blue-700'
            : 'text-slate-600 hover:text-blue-700 hover:bg-slate-100/70'
        }`}
      >
        <span>{t('classes')}</span>
        <ChevronDown
          className={`size-3 stroke-[2.25] transition-transform duration-300 ease-out ${
            showFlyout
              ? 'rotate-180 text-blue-700'
              : isActive
              ? 'text-blue-700'
              : 'text-slate-500 group-hover:text-blue-700'
          }`}
          aria-hidden="true"
        />
      </Link>

      {/* Flyout Popover Card dengan Segitiga Penunjuk (Meniru Layout Screenshot) */}
      <AnimatePresence>
        {showFlyout && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="absolute left-[-20px] top-11 z-50 rounded-2xl bg-white/95 backdrop-blur-xl text-slate-900 border border-slate-200/90 shadow-[0_20px_50px_-12px_rgba(15,23,42,0.18),0_8px_20px_-6px_rgba(15,23,42,0.08)] ring-1 ring-slate-900/5"
          >
            {/* Jembatan transparan agar kursor mouse tidak putus */}
            <div className="absolute -top-4 left-0 right-0 h-4 bg-transparent" />

            {/* Segitiga penunjuk atas (Notch) dengan border tegas tepat di bawah tombol trigger */}
            <div className="absolute left-[78px] top-0 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rotate-45 bg-white border-l border-t border-slate-200/90" />

            {/* Konten Dropdown Multi-Kolom */}
            <ProgramContent
              t={t}
              onClose={() => setOpen(false)}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ProgramDropdown;
