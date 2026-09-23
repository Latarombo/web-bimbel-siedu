"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import "leaflet/dist/leaflet.css";
import {
  Building2,
  Search,
  Phone,
  MessageCircle,
  Compass,
  Navigation,
  Copy,
  Check,
} from "lucide-react";
import { KANTOR_PUSAT, DAFTAR_CABANG, type Cabang } from "@/lib/cabang";
import { MAPS_SEARCH_URL, MAPS_DIR_URL, MAPS_ATTRIBUTION_URL } from "@/lib/site";

const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

type LeafletHost = HTMLDivElement & { _leaflet_id?: number | null };

// Gabungkan Kantor Pusat di urutan pertama beserta seluruh cabang Malang Raya
const SEMUA_CABANG: Cabang[] = [KANTOR_PUSAT, ...DAFTAR_CABANG];

// Simpan state di module level agar saat switch bahasa, cabang & tab aktif tidak reset
let globalSelectedCabangId = "pusat";
let globalActiveCabangTab: "list" | "map" = "list";

function getInitialCabangState(): { id: string; tab: "list" | "map" } {
  if (typeof window === "undefined") {
    return { id: globalSelectedCabangId, tab: globalActiveCabangTab };
  }
  const params = new URLSearchParams(window.location.search);
  const c = params.get("cabang");
  const tab = params.get("tab");
  const validId = c && SEMUA_CABANG.some((cb) => cb.id === c) ? c : globalSelectedCabangId;
  const validTab = tab === "map" || tab === "list" ? tab : globalActiveCabangTab;
  return { id: validId, tab: validTab };
}

export default function PetaCabangExplorer() {
  const t = useTranslations("public");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState<string>(() => getInitialCabangState().id);
  const [activeTab, setActiveTab] = useState<"list" | "map">(() => getInitialCabangState().tab);
  const [isHighlighted, setIsHighlighted] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const updateUrl = (newId: string, newTab: "list" | "map") => {
    globalSelectedCabangId = newId;
    globalActiveCabangTab = newTab;
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (newId && newId !== "pusat") {
        url.searchParams.set("cabang", newId);
      } else {
        url.searchParams.delete("cabang");
      }
      if (newTab === "map") {
        url.searchParams.set("tab", "map");
      } else {
        url.searchParams.delete("tab");
      }
      window.requestAnimationFrame(() => {
        history.replaceState(null, "", url.toString());
      });
    }
  };

  const handleSelectTab = (tab: "list" | "map") => {
    setActiveTab(tab);
    updateUrl(selectedId, tab);
  };

  const selectedCabang = useMemo(
    () => SEMUA_CABANG.find((c) => c.id === selectedId) || KANTOR_PUSAT,
    [selectedId]
  );

  const wadahRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const mapRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<Record<string, import("leaflet").Marker>>({});

  // Filter cabang berdasarkan pencarian nama, wilayah, atau jalan
  const filteredCabang = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return SEMUA_CABANG;
    return SEMUA_CABANG.filter(
      (c) =>
        c.nama.toLowerCase().includes(q) ||
        c.wilayah.toLowerCase().includes(q) ||
        c.alamat.toLowerCase().includes(q)
    );
  }, [search]);

  // Listener untuk trigger smooth scroll + auto-focus dari tombol "lihat kantor cabang →"
  useEffect(() => {
    function handleFocusTrigger() {
      setIsHighlighted(true);
      setActiveTab("list");
      setTimeout(() => {
        searchRef.current?.focus();
        searchRef.current?.select();
      }, 400);
      setTimeout(() => {
        setIsHighlighted(false);
      }, 2500);
    }

    window.addEventListener("siedu:focus-cabang-search", handleFocusTrigger);
    return () => {
      window.removeEventListener("siedu:focus-cabang-search", handleFocusTrigger);
    };
  }, []);

  // Inisialisasi peta Leaflet
  useEffect(() => {
    if (!wadahRef.current) return;

    let dibatalkan = false;

    // Cegah duplikasi _leaflet_id saat React StrictMode atau fast refresh
    const el = wadahRef.current as LeafletHost;
    if (el._leaflet_id) {
      el._leaflet_id = null;
    }

    (async () => {
      const L = (await import("leaflet")).default;
      if (dibatalkan || !wadahRef.current) return;

      const host = wadahRef.current as LeafletHost;
      if (host._leaflet_id) return;

      // Inisialisasi peta berpusat pada koordinat Kantor Pusat Siedu
      const map = L.map(wadahRef.current, {
        center: [KANTOR_PUSAT.lat, KANTOR_PUSAT.lng],
        zoom: 12,
        zoomControl: true,
        scrollWheelZoom: false,
        dragging: true,
      });
      mapRef.current = map;

      L.tileLayer(OSM_TILES, {
        maxZoom: 19,
        attribution: ATTR,
      }).addTo(map);

      setTimeout(() => {
        map.invalidateSize();
      }, 250);

      // Pin kustom: Merah-oranye untuk Kantor Pusat, Biru Siedu untuk cabang
      function buatIkon(isPusat: boolean) {
        const warna = isPusat ? "#e11d48" : "#1e40af";
        return L.divIcon({
          className: "custom-siedu-pin",
          html: `<div style="transform: translate(-17px, -44px);">
            <svg width="34" height="46" viewBox="0 0 34 46" aria-hidden="true" style="filter: drop-shadow(0 3px 6px rgba(0,0,0,0.3));">
              <path d="M17 1C8.2 1 1 8 1 16.6 1 27 12.2 39.4 16 44.6a1.3 1.3 0 0 0 2 0C21.8 39.4 33 27 33 16.6 33 8 25.8 1 17 1Z" fill="${warna}" stroke="#ffffff" stroke-width="2.5"/>
              <circle cx="17" cy="16.5" r="5.5" fill="#ffffff"/>
            </svg>
          </div>`,
          iconSize: [34, 46],
          iconAnchor: [17, 44],
          popupAnchor: [0, -42],
        });
      }

      // Pasang marker untuk seluruh cabang
      markersRef.current = {};
      SEMUA_CABANG.forEach((c) => {
        const isPusat = c.id === "pusat";
        const marker = L.marker([c.lat, c.lng], {
          icon: buatIkon(isPusat),
          title: c.nama,
        }).addTo(map);

        // Saat marker diklik di peta, pusatkan peta ke cabang dan pilih kartu di list
        marker.on("click", () => {
          setSelectedId(c.id);
          updateUrl(c.id, activeTab);
          if (mapRef.current) {
            mapRef.current.panTo([c.lat, c.lng], { animate: true });
          }
          const cardEl = document.getElementById(`cabang-card-${c.id}`);
          if (cardEl) {
            cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
          }
        });

        markersRef.current[c.id] = marker;
      });
    })();

    return () => {
      dibatalkan = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [activeTab]);

  // Handler saat kartu cabang di list diklik
  function handleSelectCabang(c: Cabang) {
    setSelectedId(c.id);
    const isMobile = typeof window !== "undefined" && window.innerWidth < 640;
    const nextTab = isMobile ? "map" : activeTab;
    updateUrl(c.id, nextTab);
    if (mapRef.current) {
      mapRef.current.flyTo([c.lat, c.lng], 16, { duration: 1.2 });
    }

    // Di layar smartphone, otomatis alihkan tampilan ke tab peta
    if (isMobile) {
      setActiveTab("map");
      setTimeout(() => {
        mapRef.current?.invalidateSize();
      }, 200);
    }
  }

  // Tombol reset/tampilkan semua cabang
  function handleFitAllBounds() {
    if (!mapRef.current) return;
    const bounds = SEMUA_CABANG.map((c) => [c.lat, c.lng] as [number, number]);
    mapRef.current.fitBounds(bounds, { padding: [40, 40] });
  }

  // Handler salin nomor telepon cabang ke clipboard
  function handleCopyPhone(phone: string) {
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(phone);
      setCopiedPhone(true);
      setTimeout(() => {
        setCopiedPhone(false);
      }, 2000);
    }
  }

  return (
    <div
      id="peta-lokasi"
      className="rounded-3xl border border-slate-200 bg-white shadow-md overflow-hidden scroll-mt-24"
    >
      {/* 1. Header Bar: Mempertahankan Informasi Kantor Pusat Siedu */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 bg-slate-50/90 px-4 py-3.5 sm:px-7 sm:py-4">
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-slate-100 text-slate-900 border border-slate-200 shadow-2xs shrink-0">
            <Building2 className="size-4.5" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-extrabold text-slate-900">
                {t("branchExplorerTitle")}
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              {t("branchExplorerSubtitle")}
            </p>
          </div>
        </div>

      </div>

      {/* 2. Mobile Tab Switcher (Hanya Muncul di Smartphone < 640px) */}
      <div className="flex sm:hidden border-b border-slate-200 bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => handleSelectTab("list")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "list"
              ? "bg-white text-slate-900 shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {t("branchTabList", { count: filteredCabang.length })}
        </button>
        <button
          type="button"
          onClick={() => {
            handleSelectTab("map");
            setTimeout(() => {
              mapRef.current?.invalidateSize();
            }, 100);
          }}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === "map"
              ? "bg-white text-brand shadow-2xs"
              : "text-slate-600 hover:text-slate-900"
          }`}
        >
          {t("branchTabMap")}
        </button>
      </div>

      {/* 3. Split View Explorer Container (Screenshot Reference Layout) */}
      <div className="flex flex-col sm:flex-row h-[440px] sm:h-[480px] md:h-[500px] relative overflow-hidden bg-slate-50">
        {/* Sisi Kiri: Sidebar Pencarian & List Cabang */}
        <div
          data-lenis-prevent
          className={`w-full sm:w-[360px] md:w-[390px] lg:w-[410px] flex flex-col h-full min-h-0 border-r border-slate-200 bg-white shrink-0 z-10 transition-all ${
            activeTab === "map" ? "hidden sm:flex" : "flex"
          } ${
            isHighlighted
              ? "ring-2 ring-brand/50 ring-offset-2 transition-all duration-300"
              : ""
          }`}
        >
          {/* Kolom Pencarian */}
          <div className="shrink-0 p-3 sm:p-3.5 border-b border-slate-100 bg-slate-50/70">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <input
                ref={searchRef}
                type="search"
                enterKeyHint="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("branchSearchExplorerPlaceholder")}
                className="w-full rounded-xl border border-slate-200 bg-white py-1.5 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              />
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
              <span>
                {t("branchShowingExplorer", { count: filteredCabang.length })}
              </span>
              <button
                type="button"
                onClick={handleFitAllBounds}
                className="text-[11px] font-bold text-brand hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Compass className="size-3" />
                <span>{t("branchViewAll")}</span>
              </button>
            </div>
          </div>

          {/* List Kartu Cabang (Scrollable) */}
          <div
            data-lenis-prevent
            onWheel={(e) => e.stopPropagation()}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-2.5 space-y-2 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400"
          >
            {filteredCabang.length > 0 ? (
              filteredCabang.map((c) => {
                const isSelected = selectedId === c.id;
                return (
                  <div
                    id={`cabang-card-${c.id}`}
                    key={c.id}
                    onClick={() => handleSelectCabang(c)}
                    className={`group cursor-pointer rounded-xl border p-2.5 sm:p-3 transition-all text-left ${
                      isSelected
                        ? "border-brand bg-brand-soft/20 shadow-xs ring-1 ring-brand/30"
                        : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/80"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 group-hover:text-brand transition-colors">
                        {c.nama}
                      </h4>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {c.wilayah}
                      </span>
                    </div>
                    <p className="mt-0.5 text-[11px] sm:text-xs text-slate-600 leading-relaxed line-clamp-2">
                      {c.alamat}
                    </p>
                    {c.telepon && (
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-slate-600">
                        <Phone className="size-3 text-brand shrink-0" />
                        <span className="text-slate-500 font-semibold text-[10px]">{t("branchPhonePrefix")}</span>
                        <span className="font-medium text-slate-700">{c.telepon}</span>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-slate-400">
                <Search className="size-6 mx-auto mb-2 opacity-40" />
                <p>{t("branchExplorerNotFound", { search })}</p>
              </div>
            )}
          </div>
        </div>

        {/* Sisi Kanan: Peta Leaflet Interaktif */}
        <div
          className={`flex-1 h-full relative ${
            activeTab === "list" ? "hidden sm:block" : "block"
          }`}
        >
          <div
            ref={wadahRef}
            className="h-full w-full z-0 cursor-grab active:cursor-grabbing bg-slate-100"
          />

          {/* Floating Action Card di Peta (Pojok Kiri Bawah) - Dinamis Sesuai Cabang Aktif */}
          <div className="pointer-events-none absolute bottom-2.5 left-2.5 right-2.5 sm:right-auto sm:left-3.5 sm:bottom-3.5 z-10">
            <div className="pointer-events-auto flex flex-col gap-2 rounded-2xl border border-slate-200/90 bg-white/95 p-3 sm:p-3.5 shadow-xl backdrop-blur-md max-w-[360px] sm:max-w-[380px]">
              {/* Baris Atas: Nama Cabang + Pill Wilayah */}
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <h4 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-tight">
                  {selectedCabang.nama}
                </h4>
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600 font-sans">
                  {selectedCabang.wilayah}
                </span>
              </div>

              {/* Baris Tengah: Alamat Cabang */}
              <p className="text-[11px] font-medium text-slate-600 leading-relaxed line-clamp-2">
                {selectedCabang.alamat}
              </p>

              {/* Baris Nomor Telepon (Bisa Diklik + Tombol Salin) */}
              {selectedCabang.telepon && (
                <div className="flex items-center justify-between gap-2 rounded-xl bg-slate-100/90 border border-slate-200 px-2.5 py-1.5 text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <Phone className="size-3.5 text-brand shrink-0" />
                    <span className="text-[11px] font-bold text-slate-800 shrink-0">{t("branchPhonePrefix")}</span>
                    <a
                      href={`tel:${selectedCabang.telepon.replace(/[^0-9+]/g, "")}`}
                      className="font-bold text-slate-900 hover:text-brand hover:underline truncate text-[11px] transition-colors"
                      title={t("branchCallPhone")}
                    >
                      {selectedCabang.telepon}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyPhone(selectedCabang.telepon!)}
                    className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold transition-all shrink-0 cursor-pointer ${
                      copiedPhone
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-300"
                        : "bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs"
                    }`}
                    title={t("branchCopyPhone")}
                    aria-label={t("branchCopyPhone")}
                  >
                    {copiedPhone ? (
                      <>
                        <Check className="size-3 text-emerald-600" />
                        <span>{t("branchCopied")}</span>
                      </>
                    ) : (
                      <>
                        <Copy className="size-3 text-slate-500" />
                        <span>{t("branchCopy")}</span>
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* Baris Bawah: 2 Tombol Aksi Berdampingan */}
              <div className="flex items-center gap-2 pt-0.5">
                <a
                  href={selectedCabang.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-[11px] font-bold text-white shadow-2xs hover:bg-brand-strong active:scale-95 transition-all cursor-pointer"
                >
                  <Navigation className="size-3 shrink-0" />
                  <span>{t("branchDirections")}</span>
                </a>

                {selectedCabang.wa && (
                  <a
                    href={`https://wa.me/${selectedCabang.wa}?text=${encodeURIComponent(
                      t("branchExplorerWaText", { name: selectedCabang.nama })
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-2xs hover:bg-emerald-700 active:scale-95 transition-all cursor-pointer"
                  >
                    <MessageCircle className="size-3 shrink-0" />
                    <span>WhatsApp</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Attribution Bar OpenStreetMap */}
      <div className="border-t border-slate-100 bg-slate-50/80 px-4 py-2 text-center text-[11px] text-slate-500">
        {t("branchMapAttribution")}{" "}
        <a
          href={MAPS_ATTRIBUTION_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="underline hover:text-slate-800"
        >
          OpenStreetMap
        </a>
        . {t("branchMapGoogle")}{" "}
        <a
          href={MAPS_SEARCH_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-brand hover:underline"
        >
          Google Maps
        </a>
        .
      </div>
    </div>
  );
}
