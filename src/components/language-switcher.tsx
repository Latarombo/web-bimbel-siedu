"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { LANGS, type Lang } from "@/lib/i18n";

/** Dropdown bahasa: simpan cookie `lang` lalu refresh RSC — server render ulang dengan bahasa baru. */
export function LanguageSwitcher({ current }: { current: Lang }) {
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const router = useRouter();

  const pick = (lang: Lang) => {
    setOpen(false);
    if (lang === current) return;
    document.cookie = `lang=${lang};path=/;max-age=31536000`;
    startTransition(() => router.refresh());
  };

  return (
    <div className="relative">
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
        onClick={() => setOpen((v) => !v)}
        className="relative z-20 flex items-center space-x-1.5 text-gray-700 hover:text-gray-900 transition-colors duration-200"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 21a9 9 0 100-18 9 9 0 000 18zm0-18c2.5 2.5 2.5 15.5 0 18m0-18c-2.5 2.5-2.5 15.5 0 18M3.5 9h17M3.5 15h17" />
        </svg>
        <span className="text-sm font-medium">{LANGS[current]}</span>
        <svg className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && (
        <ul role="listbox" aria-label="Pilih bahasa" className="absolute bottom-full left-1/2 z-30 mb-2 min-w-48 -translate-x-1/2 rounded-xl border border-gray-200 bg-white py-1 shadow-lg">
          {(Object.keys(LANGS) as Lang[]).map((lang) => (
            <li key={lang} role="option" aria-selected={lang === current}>
              <button
                type="button"
                onClick={() => pick(lang)}
                className={`flex w-full items-center justify-between px-4 py-2 text-sm transition-colors ${lang === current ? "font-semibold text-blue-600" : "text-gray-700 hover:bg-gray-50"}`}
              >
                {LANGS[lang]}
                {lang === current && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
