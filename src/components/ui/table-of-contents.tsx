"use client";

import { useEffect, useState } from "react";

type TableOfContentsProps = {
  title: string;
  sections: { id: string; judul: string }[];
};

export function TableOfContents({ title, sections }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>(sections[0]?.id || "");

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 140; // offset toleransi scroll

      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i].id);
        if (el) {
          const top = el.offsetTop;
          if (scrollPosition >= top) {
            setActiveId(sections[i].id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, [sections]);

  return (
    <aside className="lg:max-w-64">
      {/* Mobile View (< lg): Accordion lipat cepat */}
      <div className="lg:hidden rounded-xl border border-border bg-white/80 p-3.5 backdrop-blur-sm">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-sm text-foreground [&::-webkit-details-marker]:hidden">
            <span>{title}</span>
            <span className="text-xs text-muted group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>
          <ol className="mt-3 space-y-1 border-l-2 border-brand-soft pl-3 pt-1 text-sm">
            {sections.map((s) => {
              const isActive = activeId === s.id;
              return (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    onClick={() => setActiveId(s.id)}
                    className={`block py-1.5 text-xs transition-colors ${
                      isActive
                        ? "text-brand font-bold underline underline-offset-4"
                        : "text-slate-500 hover:text-brand hover:underline"
                    }`}
                  >
                    {s.judul}
                  </a>
                </li>
              );
            })}
          </ol>
        </details>
      </div>

      {/* Desktop View (>= lg): Sticky Sidebar dengan background kartu glassmorphism elegan */}
      <nav aria-label={title} className="hidden lg:block sticky top-28">
        <div className="rounded-2xl border border-border/80 bg-white/75 p-5 shadow-xs backdrop-blur-md">
          <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/80 mb-3 pl-3">
            {title}
          </h2>
          {/* Rail garis vertikal dengan warna brand Siedu */}
          <ol className="relative border-l-2 border-brand-soft space-y-2">
          {sections.map((s) => {
            const isActive = activeId === s.id;
            return (
              <li key={s.id} className="relative">
                <a
                  href={`#${s.id}`}
                  onClick={() => setActiveId(s.id)}
                  className={`group flex items-center pl-3.5 py-1 text-sm font-medium transition-colors ${
                    isActive
                      ? "text-slate-950 font-semibold underline underline-offset-4 decoration-1"
                      : "text-slate-500 hover:text-brand"
                  }`}
                >
                  {/* Indikator bar vertikal: warna brand Siedu (bg-brand) */}
                  <span
                    className={`absolute -left-[2px] top-0 bottom-0 w-[3px] rounded-full bg-brand transition-all duration-200 ${
                      isActive
                        ? "opacity-100 scale-y-100"
                        : "opacity-0 scale-y-75 group-hover:opacity-100 group-hover:scale-y-100"
                    }`}
                  />
                  <span className={isActive ? "" : "group-hover:underline underline-offset-4 decoration-1"}>
                    {s.judul}
                  </span>
                </a>
              </li>
            );
          })}
        </ol>
        </div>
      </nav>
    </aside>
  );
}
