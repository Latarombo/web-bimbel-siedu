'use client';

import { useState, useRef, useEffect } from 'react';
import { Link } from '@/i18n/navigation';
import { ChevronDown, Check, UserPlus } from 'lucide-react';

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

  if (!dipilih || anakList.length <= 1) {
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
        className="group inline-flex items-center gap-2.5 rounded-xl border border-slate-200/90 bg-white px-3.5 py-2 text-xs font-semibold text-slate-800 shadow-2xs transition-all hover:border-slate-300 hover:bg-slate-50 focus:outline-hidden focus:ring-2 focus:ring-brand/20 active:scale-[0.98]"
      >
        <div
          className={`flex size-5.5 items-center justify-center rounded-lg text-[10px] font-black shadow-2xs ${getJenjangAvatar(
            dipilih.jenjang
          )}`}
        >
          {dipilih.nama.slice(0, 2).toUpperCase()}
        </div>
        <span className="max-w-[130px] truncate text-slate-900 font-bold">
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
          className={`size-3.5 text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-brand' : 'group-hover:text-slate-600'
          }`}
        />
      </button>

      {/* Dropdown Menu Flyout */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 origin-top-right rounded-2xl border border-slate-200/90 bg-white p-2 shadow-2xl ring-1 ring-black/5 z-50 animate-in fade-in-0 zoom-in-95 duration-100">
          <div className="px-2.5 py-1.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {label}
            </span>
            <span className="text-[11px] text-slate-400 font-medium">
              {anakList.length} Profil
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
                  className={`flex items-center justify-between rounded-xl px-2.5 py-2 text-xs transition-colors ${
                    isSelected
                      ? 'bg-blue-50/80 text-slate-900 font-semibold border border-blue-100'
                      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-black shadow-2xs ${getJenjangAvatar(
                        child.jenjang
                      )}`}
                    >
                      {child.nama.slice(0, 2).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate font-bold text-slate-900">
                        {child.nama}
                      </p>
                      <p className="truncate text-[11px] text-slate-500 font-medium">
                        {child.kelas?.mapel || child.jenjang || 'Belum memilih kelas'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 pl-2">
                    <span
                      className={`size-2 rounded-full ${getDotColor(child)}`}
                      title={
                        child.tertunggak
                          ? 'Ada tunggakan'
                          : child.belumDibayar > 0
                            ? 'Ada tagihan aktif'
                            : 'Semua aman'
                      }
                    />
                    {isSelected && (
                      <Check className="size-3.5 text-brand stroke-[2.5]" />
                    )}
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-1.5 border-t border-slate-100 pt-1.5">
            <Link
              href="/children/new"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-bold text-brand hover:bg-brand/5 transition-colors"
            >
              <UserPlus className="size-3.5" />
              <span>{addChildLabel}</span>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
