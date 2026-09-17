"use client";
import { useTranslations } from "next-intl";


/*
 * Peta lokasi halaman Kontak — Leaflet + tile raster CARTO (voyager).
 * Dipakai hanya kalau NEXT_PUBLIC_CARTO_BASEMAPS_KEY terisi (keputusan di server,
 * lihat lib/site.ts -> PETA_INTERAKTIF); tanpa key, halaman merender iframe embed
 * OpenStreetMap seperti sebelumnya.
 * Leaflet dimuat dynamic import (ssr:false) karena butuh window.
 * Interaksi dibatasi (drag & scroll-wheel zoom off, tombol zoom on) supaya scroll
 * halaman orang tua tidak "dicuri" peta. Atribusi OSM + CARTO wajib tampil, sudah melekat di kontrol atribusi bawaan Leaflet.
 */
import { useEffect, useRef } from "react";
import type { MouseEvent as ReactMouseEvent } from "react";
import "leaflet/dist/leaflet.css";

const CARTO_RASTER = "https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png";
const ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>';

export type PetaLokasiProps = {
  lat: number;
  lng: number;
  /** Query alamat utk klik lanjutan (buka Google Maps utk navigasi) */
  mapsHref: string;
};

export default function PetaLokasi({ lat, lng, mapsHref }: PetaLokasiProps) {
 const tr = useTranslations("public");
  const wadahRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const key = process.env.NEXT_PUBLIC_CARTO_BASEMAPS_KEY?.trim();
    if (!key || !wadahRef.current) return;
    let dibersihkan = false;
    let peta: import("leaflet").Map | undefined;

    (async () => {
      const L = (await import("leaflet")).default;
      if (dibersihkan || !wadahRef.current) return;
      peta = L.map(wadahRef.current, {
        center: [lat, lng],
        zoom: 16,
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: false,
        doubleClickZoom: false,
        boxZoom: false,
        touchZoom: false,
        keyboard: false,
      });
      L.control.zoom({zoomInTitle: tr("zoomIn"), zoomOutTitle: tr("zoomOut")}).addTo(peta);
      L.tileLayer(`${CARTO_RASTER}?key=${encodeURIComponent(key)}`, {
        maxZoom: 20,
        subdomains: "abcd",
        attribution: ATTR,
      }).addTo(peta);
      // Pin kustom: tetes biru brand dengan titik putih, SVG inline tanpa aset gambar.
      const ikon = L.divIcon({
        className: "",
        html: `<svg width="34" height="46" viewBox="0 0 34 46" aria-hidden="true"><path d="M17 1C8.2 1 1 8 1 16.6 1 27 12.2 39.4 16 44.6a1.3 1.3 0 0 0 2 0C21.8 39.4 33 27 33 16.6 33 8 25.8 1 17 1Z" fill="#2563eb" stroke="#fff" stroke-width="2.5"/><circle cx="17" cy="16.5" r="5.5" fill="#fff"/></svg>`,
        iconSize: [34, 46],
        iconAnchor: [17, 44],
      });
      L.marker([lat, lng], { icon: ikon, interactive: false }).addTo(peta);
    })();

    return () => {
      dibersihkan = true;
      peta?.remove();
    };
  }, [lat, lng, tr]);

  // Sekali klik/tap di area peta -> buka navigasi Google Maps (kebutuhan utama orang tua).
  const bukaPeta = (e: ReactMouseEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".leaflet-control-container")) return;
    window.open(mapsHref, "_blank", "noopener,noreferrer");
  };

  return (
    <div className="relative">
      <div
        ref={wadahRef}
        onClick={bukaPeta}
        role="img"
        aria-label={tr("text183")}
        className="h-80 w-full cursor-pointer rounded-lg border border-slate-200 sm:h-96"
      />
      <a
        href={mapsHref}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute right-3 top-3 rounded-lg bg-white px-3 py-1.5 text-xs font-semibold text-brand shadow-[0_2px_10px_rgba(14,47,69,0.18)] hover:bg-blue-50"
      >
        {tr("text184")}</a>
    </div>
  );
}
