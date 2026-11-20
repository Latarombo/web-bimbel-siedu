"use client";

import { useEffect, useRef, useState, useMemo } from "react";
import { useTranslations, useLocale } from "next-intl";
import "leaflet/dist/leaflet.css";
import {
  Search,
  Compass,
  MapPin,
  X,
} from "lucide-react";
import {
  KANTOR_PUSAT,
  DAFTAR_CABANG,
  getCabangNama,
  getCabangWilayah,
  type Cabang,
} from "@/lib/cabang";
import { MAPS_SEARCH_URL, MAPS_ATTRIBUTION_URL } from "@/lib/site";

const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

type LeafletHost = HTMLDivElement & { _leaflet_id?: number | null };

// Gabungkan Kantor Pusat di urutan pertama beserta seluruh cabang Malang Raya
const SEMUA_CABANG: Cabang[] = [KANTOR_PUSAT, ...DAFTAR_CABANG];

interface PetaCabangExplorerProps {
  initialCabangId?: string;
  initialTab?: "list" | "map";
}

export default function PetaCabangExplorer({
  initialCabangId,
  initialTab,
}: PetaCabangExplorerProps = {}) {
  const t = useTranslations("public");
  const locale = useLocale();
  const [search, setSearch] = useState("");

  const defaultId =
    initialCabangId && SEMUA_CABANG.some((cb) => cb.id === initialCabangId)
      ? initialCabangId
      : null;
  const defaultTab = initialTab === "map" || initialTab === "list" ? initialTab : "list";

  const [selectedId, setSelectedId] = useState<string | null>(defaultId);
  const [activeTab, setActiveTab] = useState<"list" | "map">(defaultTab);
  const [isHighlighted, setIsHighlighted] = useState(false);

  // Sesuaikan state saat props dari server berubah (mis. switch bahasa via Next.js navigation)
  const [prevInitialCabangId, setPrevInitialCabangId] = useState(initialCabangId);
  if (initialCabangId !== prevInitialCabangId) {
    setPrevInitialCabangId(initialCabangId);
    if (initialCabangId && SEMUA_CABANG.some((cb) => cb.id === initialCabangId)) {
      setSelectedId(initialCabangId);
    } else {
      setSelectedId(null);
    }
  }

  const [prevInitialTab, setPrevInitialTab] = useState(initialTab);
  if (initialTab !== prevInitialTab) {
    setPrevInitialTab(initialTab);
    if (initialTab === "map" || initialTab === "list") {
      setActiveTab(initialTab);
    }
  }

  const activeTabRef = useRef(activeTab);
  useEffect(() => {
    activeTabRef.current = activeTab;
  }, [activeTab]);

  const updateUrl = (newId: string | null, newTab: "list" | "map") => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      if (newId) {
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
    () => (selectedId ? SEMUA_CABANG.find((c) => c.id === selectedId) || null : null),
    [selectedId]
  );

  const initialCabangRef = useRef(selectedCabang);

  // Sinkronkan dari URL bar saat browser back/forward (popstate)
  useEffect(() => {
    function syncFromUrl() {
      const params = new URLSearchParams(window.location.search);
      const c = params.get("cabang");
      const tab = params.get("tab");
      const validId = c && SEMUA_CABANG.some((cb) => cb.id === c) ? c : null;
      const validTab = tab === "map" || tab === "list" ? tab : "list";
      setSelectedId(validId);
      setActiveTab(validTab);
      if (mapRef.current) {
        if (validId) {
          const target = SEMUA_CABANG.find((cb) => cb.id === validId);
          if (target) {
            mapRef.current.flyTo([target.lat, target.lng], target.id === "pusat" ? 12 : 16);
          }
        } else {
          const bounds = SEMUA_CABANG.map((cb) => [cb.lat, cb.lng] as [number, number]);
          mapRef.current.fitBounds(bounds, { padding: [40, 40] });
        }
      }
    }

    window.addEventListener("popstate", syncFromUrl);
    return () => {
      window.removeEventListener("popstate", syncFromUrl);
    };
  }, []);

  // Scroll otomatis ke kartu cabang aktif saat pertama mount jika bukan pusat
  useEffect(() => {
    if (selectedId && selectedId !== "pusat") {
      const cardEl = document.getElementById(`cabang-card-${selectedId}`);
      if (cardEl) {
        cardEl.scrollIntoView({ behavior: "smooth", block: "nearest" });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
        (c.namaEn && c.namaEn.toLowerCase().includes(q)) ||
        c.wilayah.toLowerCase().includes(q) ||
        (c.wilayahEn && c.wilayahEn.toLowerCase().includes(q)) ||
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

      // Inisialisasi peta berpusat pada koordinat cabang yang dipilih atau cakupan seluruh cabang Malang
      const currentCabang = initialCabangRef.current;
      const initialCenter: [number, number] = currentCabang
        ? [currentCabang.lat, currentCabang.lng]
        : [KANTOR_PUSAT.lat, KANTOR_PUSAT.lng];
      const initialZoom = currentCabang ? (currentCabang.id === "pusat" ? 12 : 15) : 12;
      const map = L.map(wadahRef.current, {
        center: initialCenter,
        zoom: initialZoom,
        zoomControl: true,
        scrollWheelZoom: false,
        dragging: true,
      });
      mapRef.current = map;

      L.tileLayer(OSM_TILES, {
        maxZoom: 19,
        attribution: ATTR,
      }).addTo(map);

      // Jika belum ada cabang yang dipilih, tampilkan seluruh cabang di peta
      if (!currentCabang) {
        const bounds = SEMUA_CABANG.map((c) => [c.lat, c.lng] as [number, number]);
        map.fitBounds(bounds, { padding: [40, 40] });
      }

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
          title: getCabangNama(c, locale),
        }).addTo(map);

        // Saat marker diklik di peta, pusatkan peta ke cabang dan pilih kartu di list
        marker.on("click", () => {
          setSelectedId(c.id);
          updateUrl(c.id, activeTabRef.current);
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
  }, [activeTab, locale]);

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
    setSelectedId(null);
    updateUrl(null, activeTab);
    if (!mapRef.current) return;
    const bounds = SEMUA_CABANG.map((c) => [c.lat, c.lng] as [number, number]);
    mapRef.current.fitBounds(bounds, { padding: [40, 40] });
  }

  return (
    <div
      id="peta-lokasi"
      className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs overflow-hidden scroll-mt-24"
    >
      {/* 1. Mobile Tab Switcher (Hanya Muncul di Smartphone < 640px) */}
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

      {/* 3. Split View Explorer Container (Lebih Lega & Proporsional di Layar Desktop) */}
      <div className="flex flex-col sm:flex-row h-[460px] sm:h-[500px] md:h-[520px] lg:h-[560px] relative overflow-hidden bg-slate-50">
        {/* Sisi Kiri: Sidebar Pencarian & List Cabang */}
        <div
          data-lenis-prevent
          className={`w-full sm:w-[320px] md:w-[360px] lg:w-[390px] flex flex-col h-full min-h-0 border-r border-slate-200 bg-white shrink-0 z-10 transition-all ${
            activeTab === "map" ? "hidden sm:flex" : "flex"
          } ${
            isHighlighted
              ? "ring-2 ring-brand/50 ring-offset-2 transition-all duration-300"
              : ""
          }`}
        >
          {/* Kolom Pencarian */}
          <div className="shrink-0 p-3.5 border-b border-slate-100 bg-white">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-slate-500" />
              <input
                ref={searchRef}
                type="search"
                enterKeyHint="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={t("branchSearchExplorerPlaceholder")}
                className="w-full rounded-xl border border-slate-200 bg-white py-2 pl-10 pr-3.5 text-sm text-slate-900 placeholder:text-slate-500 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 transition-all"
              />
            </div>

            <div className="mt-2.5 flex items-center justify-between text-xs text-slate-500">
              <span className="font-medium">
                {t("branchShowingExplorer", { count: filteredCabang.length })}
              </span>
              <button
                type="button"
                onClick={handleFitAllBounds}
                className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <Compass className="size-3.5" />
                <span>{t("branchViewAll")}</span>
              </button>
            </div>
          </div>

          {/* List Kartu Cabang (Scrollable) */}
          <div
            data-lenis-prevent
            onWheel={(e) => e.stopPropagation()}
            className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-3 space-y-2.5 [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400"
          >
            {filteredCabang.length > 0 ? (
              filteredCabang.map((c) => {
                const isSelected = selectedId === c.id;
                return (
                  <div
                    id={`cabang-card-${c.id}`}
                    key={c.id}
                    onClick={() => handleSelectCabang(c)}
                    className={`group cursor-pointer rounded-xl border p-3.5 transition-all text-left ${
                      isSelected
                        ? "border-brand bg-blue-50/50 shadow-xs ring-1 ring-brand/20"
                        : "border-slate-200/80 bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs"
                    }`}
                  >
                    {/* Header: Ikon Lokasi + Nama Cabang (Tanpa pill badge & tanpa truncate) */}
                    <div className="flex items-start gap-2">
                      <MapPin
                        className={`size-4 shrink-0 mt-0.5 ${
                          c.id === "pusat" ? "text-rose-600" : "text-slate-700"
                        }`}
                        strokeWidth={2}
                      />
                      <h4 className="text-sm font-bold tracking-tight text-slate-900 leading-snug">
                        {getCabangNama(c, locale)}
                      </h4>
                    </div>

                    {/* Alamat Cabang Lengkap Tanpa Pemotongan */}
                    <p className="mt-1.5 text-xs text-slate-600 leading-relaxed font-normal">
                      {c.alamat}
                    </p>

                    {c.telepon && (
                      <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                        <span className="font-normal text-slate-500">{t("branchPhonePrefix")}</span>
                        <span className="font-normal text-slate-600">
                          {c.telepon}
                        </span>
                      </div>
                    )}

                    {/* Tombol aksi yang muncul saat card di-hover atau aktif terpilih */}
                    <div
                      className={`mt-2.5 pt-2 border-t border-slate-100 items-center gap-2 transition-all ${
                        isSelected ? "flex" : "hidden group-hover:flex"
                      }`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a
                        href={c.mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center rounded-lg bg-brand hover:bg-brand-strong py-1.5 px-2 text-xs font-semibold text-white shadow-2xs transition-all"
                        title={t("branchDirections")}
                      >
                        <span className="truncate">{t("branchDirections")}</span>
                      </a>

                      {c.telepon && (
                        <a
                          href={`tel:${c.telepon.replace(/\D/g, "")}`}
                          className="flex-1 inline-flex items-center justify-center rounded-lg border border-brand bg-white hover:bg-blue-50 hover:border-brand-strong py-1.5 px-2 text-xs font-semibold text-brand shadow-2xs transition-all"
                          title={t("branchContact")}
                        >
                          <span className="truncate">{t("branchContact")}</span>
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">
                <Search className="size-6 mx-auto mb-2 opacity-40 text-slate-400" />
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
          {selectedCabang && (
            <div className="pointer-events-none absolute bottom-3 left-3 right-3 sm:right-auto sm:left-4 sm:bottom-4 z-10">
              <div className="pointer-events-auto flex flex-col gap-2.5 rounded-2xl border border-slate-200/90 bg-white/95 p-4 shadow-xl shadow-slate-900/10 backdrop-blur-md max-w-[360px] sm:max-w-[380px] transition-all">
                {/* Baris Atas: Wilayah/Kategori di atas nama + Ikon Lokasi & Nama Cabang + Tombol Tutup */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span
                      className={`text-[11px] font-semibold tracking-wide ${
                        selectedCabang.id === "pusat" ? "text-rose-600" : "text-brand"
                      }`}
                    >
                      {selectedCabang.id === "pusat" ? t("contactHeadOffice") : getCabangWilayah(selectedCabang, locale)}
                    </span>
                    <div className="mt-1 flex items-start gap-1.5">
                      <MapPin
                        className={`size-4 shrink-0 mt-0.5 ${
                          selectedCabang.id === "pusat" ? "text-rose-600" : "text-slate-700"
                        }`}
                        strokeWidth={2}
                      />
                      <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug tracking-tight">
                        {getCabangNama(selectedCabang, locale)}
                      </h4>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedId(null);
                      updateUrl(null, activeTab);
                    }}
                    className="rounded-lg p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
                    aria-label={t("cardSelectClose")}
                    title={t("cardSelectClose")}
                  >
                    <X className="size-4" />
                  </button>
                </div>

                {/* Baris Tengah: Alamat Cabang Lengkap */}
                <p className="text-xs text-slate-600 leading-relaxed font-normal">
                  {selectedCabang.alamat}
                </p>

                {/* Baris Nomor Telepon */}
                {selectedCabang.telepon && (
                  <div className="flex items-center gap-1.5 text-xs text-slate-600">
                    <span className="font-normal text-slate-500">{t("branchPhonePrefix")}</span>
                    <a
                      href={`tel:${selectedCabang.telepon.replace(/\D/g, "")}`}
                      className="font-normal text-slate-600 hover:text-brand hover:underline transition-colors"
                    >
                      {selectedCabang.telepon}
                    </a>
                  </div>
                )}

                {/* Baris Bawah: Tombol Aksi (Petunjuk Arah & Hubungi) */}
                <div className="mt-1 pt-2.5 border-t border-slate-100 flex items-center gap-2">
                  <a
                    href={selectedCabang.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 inline-flex items-center justify-center rounded-lg bg-brand hover:bg-brand-strong py-1.5 px-2 text-xs font-semibold text-white shadow-2xs transition-all"
                    title={t("branchDirections")}
                  >
                    <span className="truncate">{t("branchDirections")}</span>
                  </a>

                  {selectedCabang.telepon && (
                    <a
                      href={`tel:${selectedCabang.telepon.replace(/\D/g, "")}`}
                      className="flex-1 inline-flex items-center justify-center rounded-lg border border-brand bg-white hover:bg-blue-50 hover:border-brand-strong py-1.5 px-2 text-xs font-semibold text-brand shadow-2xs transition-all"
                      title={t("branchContact")}
                    >
                      <span className="truncate">{t("branchContact")}</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 4. Attribution Bar OpenStreetMap */}
      <div className="border-t border-slate-100 bg-white px-4 py-2 text-center text-xs text-slate-500">
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
