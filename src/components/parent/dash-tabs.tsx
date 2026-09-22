"use client";

/*
 * Tab dashboard orang tua. Panel-nya di-render di server (RSC) lalu dilewatkan
 * sebagai ReactNode; komponen ini hanya menyimpan tab mana yang aktif di klien
 * supaya pindah tab instan tanpa muat ulang. Tidak menyentuh data.
 *
 * Mobile-first: bar tab bisa digeser horizontal (scrollbar disembunyikan),
 * target sentuh >= 44px. Di layar lebar tab tetap satu baris rapat.
 */
import { useId, useState } from "react";

export type DashTab = {
  key: string;
  label: string;
  /** Titik penanda kecil (mis. jumlah tunggakan) di ujung label. */
  dot?: "amber" | "rose" | null;
  panel: React.ReactNode;
};

export function DashTabs({ tabs }: { tabs: DashTab[] }) {
  const [aktif, setAktif] = useState(tabs[0]?.key);
  const base = useId();

  return (
    <div>
      <div
        role="tablist"
        aria-label="Bagian dashboard"
        className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((t) => {
          const on = t.key === aktif;
          const dotClass =
            t.dot === "rose"
              ? on
                ? "bg-white"
                : "bg-rose-500"
              : t.dot === "amber"
                ? on
                  ? "bg-white"
                  : "bg-amber-500"
                : null;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              id={`${base}-tab-${t.key}`}
              aria-selected={on}
              aria-controls={`${base}-panel-${t.key}`}
              onClick={() => setAktif(t.key)}
              className={`inline-flex min-h-11 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg px-4 text-sm font-semibold transition-colors ${
                on
                  ? "bg-brand text-white shadow-sm"
                  : "text-slate-600 hover:bg-slate-100 hover:text-brand"
              }`}
            >
              {t.label}
              {dotClass ? (
                <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} aria-hidden="true" />
              ) : null}
            </button>
          );
        })}
      </div>

      {tabs.map((t) => (
        <div
          key={t.key}
          role="tabpanel"
          id={`${base}-panel-${t.key}`}
          aria-labelledby={`${base}-tab-${t.key}`}
          hidden={t.key !== aktif}
          className="mt-4"
        >
          {t.panel}
        </div>
      ))}
    </div>
  );
}
