"use client";

import { useEffect, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Search, X, ListCollapse } from "lucide-react";

type TableOfContentsProps = {
  title: string;
  sections: { id: string; judul: string }[];
  searchPlaceholder?: string;
  emptySearchText?: string;
};

export function TableOfContents({
  title,
  sections,
  searchPlaceholder = "Cari topik pasal...",
  emptySearchText = "Tidak ada seksi yang cocok",
}: TableOfContentsProps) {
  const t = useTranslations("common");
  const [activeId, setActiveId] = useState<string>(sections[0]?.id || "");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredSections = useMemo(() => {
    if (!searchQuery.trim()) return sections;
    const query = searchQuery.toLowerCase();
    return sections.filter((s) => s.judul.toLowerCase().includes(query));
  }, [sections, searchQuery]);

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

  const handleLinkClick = (id: string) => {
    setActiveId(id);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <aside className="w-full lg:max-w-64">
      {/* Mobile View (< lg): Accordion lipat cepat dengan search bar */}
      <div className="lg:hidden rounded-2xl border border-border bg-white/90 p-4 shadow-xs backdrop-blur-md">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center justify-between font-bold text-sm text-foreground [&::-webkit-details-marker]:hidden">
            <span className="flex items-center gap-2">
              <ListCollapse className="size-4 text-brand" />
              <span>{title}</span>
              <span className="text-xs font-normal text-muted">
                ({filteredSections.length})
              </span>
            </span>
            <span className="text-xs text-muted group-open:rotate-180 transition-transform">
              ▼
            </span>
          </summary>

          <div className="mt-3 pt-3 border-t border-border/60 space-y-3">
            {/* Search Input Mobile */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-border bg-slate-50/70 pl-8 pr-7 py-1.5 text-xs text-foreground placeholder:text-muted focus:border-brand focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {filteredSections.length === 0 ? (
              <p className="py-2 text-center text-xs text-muted">
                {emptySearchText}
              </p>
            ) : (
              <ol className="space-y-1 border-l-2 border-brand-soft pl-3 pt-1 text-sm max-h-60 overflow-y-auto">
                {filteredSections.map((s) => {
                  const isActive = activeId === s.id;
                  return (
                    <li key={s.id}>
                      <a
                        href={`#${s.id}`}
                        onClick={(e) => {
                          e.preventDefault();
                          handleLinkClick(s.id);
                        }}
                        className={`block py-1.5 text-xs transition-colors ${
                          isActive
                            ? "text-brand font-bold underline underline-offset-4"
                            : "text-slate-600 hover:text-brand hover:underline"
                        }`}
                      >
                        {s.judul}
                      </a>
                    </li>
                  );
                })}
              </ol>
            )}
          </div>
        </details>
      </div>

      {/* Desktop View (>= lg): Sticky Sidebar dengan background kartu elegan */}
      <nav aria-label={title} className="hidden lg:block sticky top-28 space-y-3">
        <div className="rounded-2xl border border-border/80 bg-white/90 p-5 shadow-xs backdrop-blur-md">
          <div className="flex items-center justify-between mb-3 px-1">
            <h2 className="text-xs font-bold uppercase tracking-wider text-foreground/80 flex items-center gap-1.5">
              <ListCollapse className="size-3.5 text-brand" />
              <span>{title}</span>
            </h2>
            <span className="text-[11px] font-semibold text-muted bg-slate-100 px-2 py-0.5 rounded-full">
              {filteredSections.length}
            </span>
          </div>

          {/* Quick Search Input */}
          <div className="relative mb-3">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={searchPlaceholder}
              className="w-full rounded-lg border border-border bg-slate-50/70 pl-8 pr-7 py-1.5 text-xs text-foreground placeholder:text-muted focus:border-brand focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label={t("clearSearch")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          {filteredSections.length === 0 ? (
            <p className="py-4 text-center text-xs text-muted">
              {emptySearchText}
            </p>
          ) : (
            <ol className="relative border-l-2 border-brand-soft space-y-1.5 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
              {filteredSections.map((s) => {
                const isActive = activeId === s.id;
                return (
                  <li key={s.id} className="relative">
                    <a
                      href={`#${s.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        handleLinkClick(s.id);
                      }}
                      className={`group flex items-center pl-3.5 py-1 text-xs font-medium transition-colors ${
                        isActive
                          ? "text-brand font-bold"
                          : "text-slate-600 hover:text-brand"
                      }`}
                    >
                      {/* Indikator bar vertikal: warna brand Siedu */}
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
          )}
        </div>
      </nav>
    </aside>
  );
}
