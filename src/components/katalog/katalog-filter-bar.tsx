"use client";

import { useState, useEffect, useRef, useTransition } from "react";
import Form from "next/form";
import { useRouter } from "next/navigation";
import { FilterKatalogModal } from "./filter-katalog-modal";
import { Search, ChevronDown, ArrowRight, Loader2 } from "lucide-react";

export type KatalogFilterBarProps = {
  currentJenjang: string;
  currentTingkat?: string;
  currentQ?: string;
  currentSort?: string;
  actionUrl: string;
  translations: {
    welcomeTitle: string;
    welcomeSubtitle: string;
    chooseClass: string;
    applyFilterSelection: string;
    resetFilter: string;
    allLevelsFull: string;
    popularPackageFor: string;
    selectLevelAndClass: string;
    searchPlaceholderCatalog: string;
    searchButtonCatalog: string;
  };
};

type SuggestionItem = {
  id: number;
  nama: string;
  jenjang: string;
  guru: string;
  periode: string;
  biayaPeriode: number;
};

export function KatalogFilterBar({
  currentJenjang,
  currentTingkat,
  currentQ = "",
  currentSort = "terbaru",
  actionUrl,
  translations,
}: KatalogFilterBarProps) {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(currentQ);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setSearchQuery(currentQ);
  }, [currentQ]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = searchQuery.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      return;
    }

    setIsLoadingSuggestions(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          q: trimmed,
          jenjang: currentJenjang,
        });
        const res = await fetch(`/api/katalog/suggest?${params.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data.suggestions || []);
          setIsDropdownOpen(true);
        }
      } catch (err) {
        console.error("Gagal mengambil saran pencarian:", err);
      } finally {
        setIsLoadingSuggestions(false);
      }
    }, 250);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, currentJenjang]);

  let triggerLabel = translations.selectLevelAndClass;
  if (currentJenjang !== "Semua") {
    triggerLabel = currentJenjang;
    if (currentTingkat && currentTingkat !== "Semua") {
      triggerLabel += `, ${currentTingkat}`;
    }
  }

  const handleSelectClass = (id: number) => {
    setIsDropdownOpen(false);
    startTransition(() => {
      router.push(`/classes/${id}`);
    });
  };

  const handleSelectKeyword = (keyword: string) => {
    setIsDropdownOpen(false);
    setSearchQuery(keyword);
    const params = new URLSearchParams();
    if (keyword) params.set("q", keyword);
    if (currentJenjang !== "Semua") params.set("jenjang", currentJenjang);
    if (currentTingkat && currentTingkat !== "Semua") params.set("tingkat", currentTingkat);
    if (currentSort !== "terbaru") params.set("sort", currentSort);
    startTransition(() => {
      router.push(`${actionUrl}?${params.toString()}`);
    });
  };

  return (
    <div ref={containerRef} className="relative">
      <Form
        action={actionUrl}
        prefetch={false}
        onSubmit={() => setIsDropdownOpen(false)}
        className="flex flex-col md:flex-row items-stretch gap-2.5 rounded-2xl border border-border bg-white p-2.5 shadow-sm"
      >
        <input type="hidden" name="sort" value={currentSort} />
        {currentJenjang !== "Semua" ? (
          <input type="hidden" name="jenjang" value={currentJenjang} />
        ) : null}
        {currentTingkat && currentTingkat !== "Semua" ? (
          <input type="hidden" name="tingkat" value={currentTingkat} />
        ) : null}

        {/* Tombol filter jenjang & tingkat */}
        <button
          type="button"
          onClick={() => {
            setIsDropdownOpen(false);
            setIsModalOpen(true);
          }}
          className="flex items-center justify-between gap-3 rounded-xl border-2 border-brand bg-brand-soft px-4 py-2.5 text-sm font-bold text-brand hover:bg-blue-100 hover:border-brand-strong transition cursor-pointer md:min-w-[210px] shrink-0 shadow-2xs"
        >
          <span className="truncate">{triggerLabel}</span>
          <span
            className={`inline-flex size-6 shrink-0 items-center justify-center rounded-full bg-brand text-white transition-transform duration-200 ${isModalOpen ? "rotate-180" : "rotate-0"}`}
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </span>
        </button>

        {/* Kolom pencarian teks */}
        <div className="relative flex-1 flex flex-col justify-center">
          <label className="flex items-center gap-2 rounded-xl border border-border bg-slate-50/80 px-3.5 py-1 focus-within:border-brand focus-within:bg-white focus-within:ring-2 focus-within:ring-brand/15 transition-all">
            {isLoadingSuggestions ? (
              <Loader2 className="h-4 w-4 shrink-0 text-brand animate-spin" />
            ) : (
              <Search className="h-4 w-4 shrink-0 text-muted" />
            )}
            <input
              type="search"
              enterKeyHint="search"
              maxLength={100}
              name="q"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery.trim().length >= 2 && suggestions.length > 0) {
                  setIsDropdownOpen(true);
                }
              }}
              placeholder={translations.searchPlaceholderCatalog}
              aria-label={translations.searchPlaceholderCatalog}
              autoComplete="off"
              className="w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted text-foreground"
            />
          </label>

          {/* Menu saran pencarian kelas */}
          {isDropdownOpen && searchQuery.trim().length >= 2 && (
            <div className="absolute top-[calc(100%+8px)] left-0 right-0 z-50 overflow-hidden rounded-xl border border-border bg-white shadow-lg animate-in fade-in-0 duration-100">
              {suggestions.length > 0 ? (
                <div className="divide-y divide-border/60">
                  <div className="bg-slate-50 px-4 py-2 text-xs font-semibold text-muted">
                    Pilihan Kelas
                  </div>
                  <div className="max-h-72 overflow-y-auto py-1">
                    {suggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectClass(item.id)}
                        className="w-full flex items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-slate-50 transition-colors group cursor-pointer"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-xs font-medium text-foreground">
                              {item.jenjang}
                            </span>
                            <span className="font-semibold text-sm text-foreground truncate group-hover:text-brand transition-colors">
                              {item.nama}
                            </span>
                          </div>
                          <p className="mt-0.5 text-xs text-muted truncate">
                            Guru: {item.guru} ({item.periode})
                          </p>
                        </div>
                        <div className="text-right shrink-0">
                          <span className="text-xs font-bold text-foreground block">
                            Rp {item.biayaPeriode.toLocaleString("id-ID")}
                          </span>
                          <span className="text-xs text-brand inline-flex items-center gap-0.5 group-hover:underline">
                            Buka kelas
                          </span>
                        </div>
                      </button>
                    ))}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelectKeyword(searchQuery.trim())}
                    className="w-full flex items-center justify-between px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-xs font-semibold text-brand transition-colors cursor-pointer"
                  >
                    <span>Lihat hasil lengkap untuk &quot;{searchQuery.trim()}&quot;</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : !isLoadingSuggestions ? (
                <div className="p-4 text-center">
                  <p className="text-sm font-medium text-foreground">Kelas belum ditemukan</p>
                  <p className="text-xs text-muted mt-1">
                    Coba kata kunci lain atau pilih jenjang di menu sebelah kiri.
                  </p>
                </div>
              ) : null}
            </div>
          )}
        </div>

        {/* Tombol aksi cari */}
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand hover:bg-brand-strong px-6 py-2.5 text-sm font-bold text-white transition-colors cursor-pointer disabled:opacity-60"
        >
          <Search className="h-4 w-4" />
          <span>{translations.searchButtonCatalog}</span>
        </button>
      </Form>

      {/* Dialog pemilihan jenjang dan kelas */}
      <FilterKatalogModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        currentJenjang={currentJenjang}
        currentTingkat={currentTingkat}
        currentQ={searchQuery}
        currentSort={currentSort}
        translations={translations}
      />
    </div>
  );
}
