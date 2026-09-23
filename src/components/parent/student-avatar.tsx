'use client';

import { useState } from 'react';
import Image from 'next/image';

export interface StudentAvatarProps {
  nama: string;
  jenjang?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showRing?: boolean;
}

const FEMALE_NAMES_REGEX =
  /(putri|siti|anisa|annisa|aisyah|nur|dinda|zahra|rahma|maya|tiara|amelia|cantika|fitri|indah|lestari|safira|ayu|dewi|fatimah|kayla|salma|nayla|alika|mutia|nasywa|clarissa|amanda|nadia)/i;

const MALE_NAMES_REGEX =
  /(budi|bayu|ahmad|rizky|muhammad|fajar|dimas|aditya|raffi|ilham|agus|eko|reza|kevin|aldo|dani|bagas|doni|rama|aryo|alif|kenzo)/i;

function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getStudentAvatarUrl(
  nama: string,
  jenjang?: string | null
): string {
  const cleanName = (nama || '').trim();
  let isFemale = false;

  if (FEMALE_NAMES_REGEX.test(cleanName)) {
    isFemale = true;
  } else if (MALE_NAMES_REGEX.test(cleanName)) {
    isFemale = false;
  } else {
    // Seed dari nama, bukan id: id belum ada saat preview form anak baru,
    // supaya preview dan hasil setelah save selalu memilih ilustrasi sama.
    isFemale = simpleHash(cleanName) % 2 === 1;
  }

  const j = (jenjang || '').toUpperCase();

  if (j === 'TK') {
    return isFemale
      ? '/images/avatars/student_tk_girl.svg'
      : '/images/avatars/student_tk_boy.jpg';
  }

  if (j === 'SD') {
    return isFemale
      ? '/images/avatars/student_sd_girl.jpg'
      : '/images/avatars/student_sd_boy.jpg';
  }

  if (j === 'SMP') {
    return isFemale
      ? '/images/avatars/student_smp_girl.svg'
      : '/images/avatars/student_smp_boy.svg';
  }

  if (j === 'SMA') {
    return isFemale
      ? '/images/avatars/student_sma_girl.svg'
      : '/images/avatars/student_sma_boy.svg';
  }

  // Fallback default
  return isFemale
    ? '/images/avatars/student_sd_girl.jpg'
    : '/images/avatars/student_sd_boy.jpg';
}

const SIZE_CLASSES = {
  xs: 'size-7 text-[10px]',
  sm: 'size-8 sm:size-9 text-xs',
  md: 'size-12 sm:size-13 text-sm',
  lg: 'size-14 sm:size-16 text-lg',
  xl: 'size-20 sm:size-24 text-2xl',
};

const PIXEL_SIZES = {
  xs: 28,
  sm: 36,
  md: 52,
  lg: 64,
  xl: 96,
};

const JENJANG_RINGS: Record<string, string> = {
  TK: 'ring-amber-300/80',
  SD: 'ring-sky-300/80',
  SMP: 'ring-indigo-300/80',
  SMA: 'ring-emerald-300/80',
  DEFAULT: 'ring-blue-300/80',
};

const JENJANG_FALLBACK_BG: Record<string, string> = {
  TK: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white',
  SD: 'bg-gradient-to-br from-sky-400 to-blue-600 text-white',
  SMP: 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white',
  SMA: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white',
  DEFAULT: 'bg-gradient-to-br from-blue-600 to-slate-700 text-white',
};

export function StudentAvatar({
  nama,
  jenjang,
  size = 'md',
  className = '',
  showRing = true,
}: StudentAvatarProps) {
  const [hasError, setHasError] = useState(false);
  const avatarUrl = getStudentAvatarUrl(nama, jenjang);
  const inisial = (nama || '').trim().slice(0, 2).toUpperCase() || 'SI';

  const jKey = (jenjang || 'DEFAULT').toUpperCase();
  const ringClass = showRing
    ? `ring-2 ${JENJANG_RINGS[jKey] ?? JENJANG_RINGS.DEFAULT}`
    : '';
  const fallbackBg =
    JENJANG_FALLBACK_BG[jKey] ?? JENJANG_FALLBACK_BG.DEFAULT;

  const sizeClass = SIZE_CLASSES[size] ?? SIZE_CLASSES.md;
  const pxSize = PIXEL_SIZES[size] ?? PIXEL_SIZES.md;

  if (hasError) {
    return (
      <div
        className={`flex ${sizeClass} items-center justify-center rounded-full font-black ${fallbackBg} shadow-xs shrink-0 ${ringClass} ${className}`}
        aria-label={nama}
      >
        <span>{inisial}</span>
      </div>
    );
  }

  return (
    <div
      className={`relative ${sizeClass} rounded-full overflow-hidden shrink-0 border border-slate-200/90 bg-slate-100 shadow-xs ${ringClass} ${className}`}
    >
      <Image
        src={avatarUrl}
        alt={`Foto profil ${nama}`}
        width={pxSize}
        height={pxSize}
        className="size-full object-cover rounded-full"
        onError={() => setHasError(true)}
        priority={size === 'lg' || size === 'xl'}
      />
    </div>
  );
}
