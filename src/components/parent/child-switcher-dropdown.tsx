'use client';

import { useState, useRef, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { ChevronDown, UserPlus } from 'lucide-react';
import { StudentAvatar } from '@/components/parent/student-avatar';

export interface ChildItem {
  id: number;
  nama: string;
  jenjang?: string | null;
  kelas?: { mapel: string; guru: string } | null;
  tertunggak: boolean;
  belumDibayar: number;
}

interface Props {
  anakList: ChildItem[];
  dipilihId: number;
  label?: string;
  addChildLabel?: string;
}

const JENJANG_AVATAR: Record<string, string> = {
  TK: 'bg-gradient-to-br from-amber-400 to-orange-500 text-white',
  SD: 'bg-gradient-to-br from-sky-400 to-blue-600 text-white',
  SMP: 'bg-gradient-to-br from-indigo-500 to-violet-600 text-white',
  SMA: 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white',
  DEFAULT: 'bg-gradient-to-br from-blue-600 to-slate-700 text-white',
};

function getJenjangAvatar(jenjang?: string | null) {
  if (!jenjang) return JENJANG_AVATAR.DEFAULT;
  const key = jenjang.toUpperCase();
  return JENJANG_AVATAR[key] ?? JENJANG_AVATAR.DEFAULT;
}

export function ChildSwitcherDropdown({
  anakList,
  dipilihId,
  label = 'Pilih Anak',
  addChildLabel = 'Tambah Profil Anak',
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const dipilih = anakList.find((a) => a.id === dipilihId) ?? anakList[0];

  // Close when clicked outside or on Escape
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!dipilih || anakList.length === 0) {
    return null;
  }

  const getDotColor = (child: ChildItem) => {
    if (child.tertunggak) return 'bg-rose-500';
    if (child.belumDibayar > 0) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className="group inline-flex items-center gap-2.5 rounded-xl border border-white/25 bg-white/10 px-3.5 py-2 text-xs font-semibold text-white shadow-2xs backdrop-blur-xs transition-all hover:border-white/40 hover:bg-white/15 focus:outline-hidden focus:ring-2 focus:ring-white/40 active:scale-[0.98]"
      >
        <StudentAvatar
          nama={dipilih.nama}
          jenjang={dipilih.jenjang}
          size="xs"
          showRing={false}
          className="size-6 shrink-0"
        />
        <span className="max-w-[130px] truncate text-white font-bold">
          {dipilih.nama}
        </span>
        <span
          className={`size-2 rounded-full ${getDotColor(dipilih)}`}
          title={
            dipilih.tertunggak
              ? 'Ada tunggakan'
              : dipilih.belumDibayar > 0
                ? 'Ada tagihan aktif'
                : 'Semua aman'
          }
        />
        <ChevronDown
          className={`size-3.5 text-white/70 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-white' : 'group-hover:text-white'
          }`}
        />
      </button>

      {/* Dropdown Menu Flyout */}
      {isOpen && (
        <div className="absolute right-0 mt-2.5 w-72 origin-top-right overflow-hidden rounded-2xl border border-white/60 bg-white/95 p-2 shadow-xl ring-1 ring-black/5 backdrop-blur-md z-50 animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="mb-1 flex items-center justify-between gap-2 rounded-xl bg-brand/5 px-3 py-2">
            <span className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-brand">
              <span className="size-1.5 rounded-full bg-brand" />
              {label}
            </span>
            <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[10px] font-bold text-brand">
              {anakList.length} profil
            </span>
          </div>

          <div className="mt-1 space-y-1 max-h-64 overflow-y-auto overscroll-contain pr-1 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400">
            {anakList.map((child) => {
              const isSelected = child.id === dipilih.id;
              return (
                <Link
                  key={child.id}
                  href={`/home?anak=${child.id}`}
                  scroll={false}
                  onClick={() => setIsOpen(false)}
                  aria-current={isSelected ? 'true' : undefined}
                  className={`group flex items-center justify-between gap-2 rounded-xl border px-2.5 py-2 text-xs transition-all ${
                    isSelected
                      ? 'border-brand/30 bg-brand/10 text-slate-900 shadow-xs'
                      : 'border-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <StudentAvatar
                      nama={child.nama}
                      jenjang={child.jenjang}
                      size="sm"
                    />
                    <div className="min-w-0">
                      <p
                        className={`truncate font-bold ${
                          isSelected ? 'text-slate-900' : 'text-slate-800'
                        }`}
                      >
                        {child.nama}
                      </p>
                      <p className="truncate text-[11px] text-slate-500 font-medium">
                        {child.kelas?.mapel || child.jenjang || 'Belum memilih kelas'}
                      </p>
                    </div>
                  </div>

                  <span
                    role="radio"
                    aria-checked={isSelected}
                    className={`flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                      isSelected
                        ? 'border-brand'
                        : 'border-slate-300 group-hover:border-slate-400'
                    }`}
                  >
                    {isSelected && (
                      <span className="size-1.5 rounded-full bg-brand" />
                    )}
                  </span>
                </Link>
              );
            })}
          </div>

          <div className="mt-1.5 border-t border-slate-100 pt-1.5">
            <Link
              href="/children/new"
              onClick={() => setIsOpen(false)}
              className="mt-1 flex items-center gap-2.5 rounded-xl bg-brand/5 px-2.5 py-2 text-xs font-bold text-brand transition-colors hover:bg-brand/10"
            >
              <span className="flex size-6 items-center justify-center rounded-full bg-brand/10">
                <UserPlus className="size-3.5" />
              </span>
              <span>{addChildLabel}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
