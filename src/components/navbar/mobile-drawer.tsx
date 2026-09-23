'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { useTranslations } from 'next-intl';
import { AnimatePresence, motion } from 'motion/react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { SITE } from '@/lib/site';
import {
  Home,
  BookOpen,
  Info,
  PhoneCall,
  ChevronDown,
  X,
  ArrowRight,
  MessageCircle,
} from 'lucide-react';
import { PROGRAM_CATEGORIES } from './types';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  pathname: string;
  locale: string;
  dashboardHref?: string | null;
}

let globalIsProgramOpen = false;

export function MobileDrawer({
  isOpen,
  onClose,
  pathname,
  locale,
  dashboardHref = null,
}: MobileDrawerProps) {
  const [isProgramOpen, setIsProgramOpen] = useState(() => globalIsProgramOpen);
  const t = useTranslations('chrome.nav');
  const isEn = locale === 'en';

  const handleToggleProgram = () => {
    setIsProgramOpen((prev) => {
      const next = !prev;
      globalIsProgramOpen = next;
      return next;
    });
  };

  const handleClose = () => {
    globalIsProgramOpen = false;
    onClose();
  };

  const isHomeActive = pathname === '/';
  const isClassesActive = pathname === '/classes' || pathname.startsWith('/classes/');
  const isAboutActive = pathname === '/about' || pathname.startsWith('/about/');
  const isContactActive = pathname === '/contact' || pathname.startsWith('/contact/');

  // Body scroll lock saat drawer terbuka
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen]);

  // Tutup dengan tombol Escape
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Nomor WhatsApp resmi Siedu
  const cleanWa = SITE.whatsapp.replace(/\D/g, '').replace(/^0/, '62');
  const waText = isEn
    ? 'Hello Siedu Admin, I would like to consult about learning programs.'
    : 'Halo Admin Siedu, saya ingin konsultasi mengenai program bimbingan belajar.';
  const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(waText)}`;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* 1. Backdrop Overlay dengan Fade Transition */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            aria-hidden="true"
            onClick={onClose}
          />

          {/* 2. Side Sheet Drawer (Slide dari Kanan + Gesture Swipe-to-Dismiss) */}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={isEn ? 'Navigation Menu' : 'Menu Navigasi'}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            drag="x"
            dragConstraints={{ left: 0 }}
            dragElastic={{ left: 0.05, right: 0.5 }}
            onDragEnd={(_e, info) => {
              // Jika digeser ke kanan > 80px atau swipe cepat (velocity > 300)
              if (info.offset.x > 80 || info.velocity.x > 300) {
                onClose();
              }
            }}
            className="fixed top-0 right-0 bottom-0 z-50 flex flex-col w-[86vw] max-w-sm sm:max-w-md bg-white shadow-2xl border-l border-slate-200/90 overflow-hidden touch-pan-y"
          >
            {/* Header Drawer */}
            <div className="shrink-0 flex items-center justify-between px-5 py-3.5 border-b border-slate-100 bg-white/95">
              <Link
                href="/"
                onClick={onClose}
                className="flex items-center focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg outline-none"
                aria-label={t('brandAria')}
              >
                <Image
                  src="/images/Logo.png"
                  alt="Siedu"
                  width={112}
                  height={34}
                  className="h-7 w-auto"
                  priority
                />
              </Link>

              {/* Close Button (Touch target WCAG 44x44px = size-11) */}
              <button
                type="button"
                onClick={onClose}
                aria-label={t('menuClose')}
                className="grid size-11 place-items-center rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none cursor-pointer"
              >
                <X className="size-5.5" aria-hidden="true" />
              </button>
            </div>

            {/* Scrollable Navigation Body */}
            <div className="flex-1 overflow-y-auto px-4 py-3.5 space-y-1 overscroll-contain">
              <span className="block px-3 py-1 text-[11px] font-medium text-slate-400">
                {isEn ? 'Main Menu' : 'Menu Utama'}
              </span>

              <ul className="flex flex-col space-y-1">
                {/* 1. Beranda */}
                <li>
                  <Link
                    href="/"
                    aria-current={isHomeActive ? 'page' : undefined}
                    onClick={onClose}
                    className={`flex min-h-11 items-center gap-3.5 px-3.5 rounded-xl text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                      isHomeActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'
                    }`}
                  >
                    <Home
                      className={`size-5 shrink-0 ${isHomeActive ? 'text-blue-600' : 'text-slate-400'}`}
                      aria-hidden="true"
                    />
                    <span>{t('home')}</span>
                  </Link>
                </li>

                {/* 2. Program / Kelas dengan Accordion Multi-Kategori */}
                <li>
                  <div className="rounded-xl overflow-hidden bg-slate-50/50 border border-slate-100/80">
                    <div
                      className={`flex min-h-11 items-center justify-between px-3.5 text-sm font-semibold transition-colors ${
                        isClassesActive
                          ? 'bg-blue-50/80 text-blue-700'
                          : 'text-slate-700'
                      }`}
                    >
                      <Link
                        href="/classes"
                        onClick={onClose}
                        className="flex items-center gap-3.5 flex-1 min-h-11 focus-visible:ring-2 focus-visible:ring-blue-600 rounded-lg outline-none"
                      >
                        <BookOpen
                          className={`size-5 shrink-0 ${isClassesActive ? 'text-blue-600' : 'text-slate-400'}`}
                          aria-hidden="true"
                        />
                        <span>{t('classes')}</span>
                      </Link>

                      {/* Accordion Toggle (Touch target 44x44px) */}
                      <button
                        type="button"
                        onClick={handleToggleProgram}
                        aria-expanded={isProgramOpen}
                        aria-label={isEn ? 'Toggle program options' : 'Buka pilihan jenjang program'}
                        className="grid size-11 place-items-center text-slate-600 hover:text-blue-700 transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none cursor-pointer"
                      >
                        <ChevronDown
                          className={`size-4.5 stroke-[2.25] transition-transform duration-200 ${
                            isProgramOpen ? 'rotate-180 text-blue-700' : 'text-slate-600'
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    </div>

                    {/* Sub-menu Program Accordion */}
                    <AnimatePresence>
                      {isProgramOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: 'easeInOut' }}
                          className="overflow-hidden border-t border-slate-100 bg-white"
                        >
                          <div className="px-3.5 py-2.5 space-y-3.5">
                            {PROGRAM_CATEGORIES.map((category) => (
                              <div key={category.titleId} className="space-y-1">
                                <span className="block px-2 text-[11px] font-medium text-slate-400">
                                  {isEn ? category.titleEn : category.titleId}
                                </span>
                                <div className="space-y-0.5">
                                  {category.items.map((item) => (
                                    <Link
                                      key={item.labelId}
                                      href={item.href}
                                      onClick={onClose}
                                      className="flex min-h-[38px] items-center px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50/50 active:bg-blue-50 transition-colors"
                                    >
                                      {isEn ? item.labelEn : item.labelId}
                                    </Link>
                                  ))}
                                </div>
                              </div>
                            ))}

                            {/* Tombol Lihat Semua Kelas */}
                            <div className="pt-2 border-t border-slate-100">
                              <Link
                                href="/classes"
                                onClick={onClose}
                                className="flex min-h-10 items-center justify-between px-3 py-2 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50/70 hover:bg-blue-100/70 rounded-lg transition-colors group"
                              >
                                <span>{t('allClasses')}</span>
                                <ArrowRight className="size-3.5 transition-transform duration-150 group-hover:translate-x-0.5" />
                              </Link>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </li>

                {/* 3. Tentang Kami */}
                <li>
                  <Link
                    href="/about"
                    aria-current={isAboutActive ? 'page' : undefined}
                    onClick={onClose}
                    className={`flex min-h-11 items-center gap-3.5 px-3.5 rounded-xl text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                      isAboutActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'
                    }`}
                  >
                    <Info
                      className={`size-5 shrink-0 ${isAboutActive ? 'text-blue-600' : 'text-slate-400'}`}
                      aria-hidden="true"
                    />
                    <span>{t('about')}</span>
                  </Link>
                </li>

                {/* 4. Kontak */}
                <li>
                  <Link
                    href="/contact"
                    aria-current={isContactActive ? 'page' : undefined}
                    onClick={onClose}
                    className={`flex min-h-11 items-center gap-3.5 px-3.5 rounded-xl text-sm font-semibold transition-colors focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none ${
                      isContactActive
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-slate-700 hover:bg-slate-50 active:bg-slate-100'
                    }`}
                  >
                    <PhoneCall
                      className={`size-5 shrink-0 ${isContactActive ? 'text-blue-600' : 'text-slate-400'}`}
                      aria-hidden="true"
                    />
                    <span>{t('contact')}</span>
                  </Link>
                </li>
              </ul>
            </div>

            {/* Bottom Action Card (Sticky Footer) */}
            <div className="shrink-0 p-4 border-t border-slate-100 bg-slate-50/80 space-y-3 pb-[max(1.25rem,env(safe-area-inset-bottom))]">
              {/* Language Switcher Bar */}
              <div className="flex items-center justify-between px-3 py-1.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
                <span className="text-xs font-semibold text-slate-500">
                  {isEn ? 'Language:' : 'Pilih Bahasa:'}
                </span>
                <LanguageSwitcher variant="toggle" />
              </div>

              {/* Auth Buttons */}
              {dashboardHref ? (
                <Link
                  href={dashboardHref}
                  onClick={onClose}
                  className="flex min-h-11 items-center justify-center px-4 py-2.5 text-sm font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                >
                  {t('dashboard')}
                </Link>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Link
                    href="/login"
                    onClick={onClose}
                    className="flex min-h-11 items-center justify-center px-3 py-2 text-xs sm:text-sm font-bold text-slate-700 border border-slate-300 bg-white rounded-lg hover:bg-slate-50 active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:outline-none"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href="/register"
                    onClick={onClose}
                    className="flex min-h-11 items-center justify-center px-3 py-2 text-xs sm:text-sm font-bold text-white rounded-lg shadow-xs hover:brightness-95 active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:outline-none"
                    style={{ backgroundColor: '#f26d0f' }}
                  >
                    {t('signup')}
                  </Link>
                </div>
              )}

              {/* Quick WhatsApp Support Link */}
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex min-h-10 items-center justify-center gap-2 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50/90 border border-emerald-200/80 rounded-lg hover:bg-emerald-100/80 active:scale-[0.98] transition-all focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:outline-none"
              >
                <MessageCircle className="size-4 shrink-0 text-emerald-600" aria-hidden="true" />
                <span>
                  {isEn ? 'Need help? Chat CS via WhatsApp' : 'Butuh bantuan? Chat CS via WhatsApp'}
                </span>
              </a>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default MobileDrawer;
