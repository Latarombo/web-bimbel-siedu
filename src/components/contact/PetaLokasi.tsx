"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

const OSM_TILES = "https://tile.openstreetmap.org/{z}/{x}/{y}.png";
const ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

export type PetaLokasiProps = {
  lat: number;
  lng: number;
  mapsHref?: string;
  className?: string;
};

export default function PetaLokasi({ lat, lng, mapsHref, className }: PetaLokasiProps) {
  const wadahRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wadahRef.current) return;

    let dibatalkan = false;
    let mapInstance: import("leaflet").Map | null = null;

    // Bersihkan _leaflet_id jika ada sisa dari hot-reload / React StrictMode
    if ((wadahRef.current as any)._leaflet_id) {
      (wadahRef.current as any)._leaflet_id = null;
    }

    (async () => {
      const L = (await import("leaflet")).default;
      if (dibatalkan || !wadahRef.current) return;

      // Cek ulang agar tidak inisialisasi ganda
      if ((wadahRef.current as any)._leaflet_id) return;

      mapInstance = L.map(wadahRef.current, {
        center: [lat, lng],
        zoom: 16,
        zoomControl: true,
        scrollWheelZoom: false,
        dragging: true,
      });

      L.tileLayer(OSM_TILES, {
        maxZoom: 19,
        attribution: ATTR,
      }).addTo(mapInstance);

      // Pin kustom biru Siedu dengan titik putih
      const ikon = L.divIcon({
        className: "custom-siedu-pin",
        html: `<div style="transform: translate(-17px, -44px);">
          <svg width="34" height="46" viewBox="0 0 34 46" aria-hidden="true">
            <path d="M17 1C8.2 1 1 8 1 16.6 1 27 12.2 39.4 16 44.6a1.3 1.3 0 0 0 2 0C21.8 39.4 33 27 33 16.6 33 8 25.8 1 17 1Z" fill="#1e40af" stroke="#ffffff" stroke-width="2.5"/>
            <circle cx="17" cy="16.5" r="5.5" fill="#ffffff"/>
          </svg>
        </div>`,
        iconSize: [34, 46],
        iconAnchor: [17, 44],
      });

      L.marker([lat, lng], { icon: ikon }).addTo(mapInstance);

      setTimeout(() => {
        if (!dibatalkan && mapInstance) {
          mapInstance.invalidateSize();
        }
      }, 150);
    })();

    return () => {
      dibatalkan = true;
      if (mapInstance) {
        mapInstance.remove();
      }
    };
  }, [lat, lng]);

  return (
    <div
      ref={wadahRef}
      className={className ?? "h-full w-full min-h-[280px] sm:min-h-[380px] z-0 cursor-grab active:cursor-grabbing"}
    />
  );
}
