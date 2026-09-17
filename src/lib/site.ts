export const SITE = {
 nama: "Siedu",
 email: "halo@siedu.id",
 telepon: "+62 811 2233 4455",
 alamat: [
  "Gg. 7 65134 No.47, RT.7/RW.2",
  "Mergosono, Kec. Kedungkandang",
  "Kota Malang, Jawa Timur 65134",
 ],
 sosial: [
  { nama: "Instagram", url: "https://instagram.com" },
  { nama: "X (Twitter)", url: "https://twitter.com" },
  { nama: "YouTube", url: "https://youtube.com" },
 ],
} as const;

/*
 * Peta halaman Kontak (A7). Sumber URL: satu tempat, alamat dari SITE.alamat.
 *
 * Provider Google (Maps Embed API resmi) dipakai kalau NEXT_PUBLIC_GMAPS_EMBED_KEY
 * terisi — pin akurat karena geocoding Google membaca alamat lengkap ini dengan
 * benar. Key Embed API memang publik (dibatasi HTTP referrer di Cloud Console),
 * jadi NEXT_PUBLIC_ bukan pelanggaran rahasia: nilainya memang muncul di src iframe.
 *
 * Tanpa key, fallback ke embed OpenStreetMap (tanpa API key, terverifikasi render,
 * wajib atribusi © OSM). Ini supaya halaman tetap punya peta yang terlihat.
 *
 * Bukan output=embed Google: sejak 13 Sep terbukti menyajikan iframe kosong
 * (0 tile) tanpa API key. Jangan dipakai lagi.
 */
const mapsQuery = encodeURIComponent(SITE.alamat.join(", "));
export const MAPS_SEARCH_URL = `https://www.google.com/maps/search/?api=1&query=${mapsQuery}`;

// Pusat kelurahan Mergosono, hasil geocoding Nominatim (alamat gang tidak ter-gecode).
export const LOKASI_LAT = -7.9985042;
export const LOKASI_LNG = 112.6347844;
const OSM_LAT = LOKASI_LAT;
const OSM_LNG = LOKASI_LNG;
const OSM_BBOX = `${(OSM_LNG - 0.01).toFixed(5)},${(OSM_LAT - 0.005).toFixed(5)},${(OSM_LNG + 0.01).toFixed(5)},${(OSM_LAT + 0.005).toFixed(5)}`;
const OSM_EMBED_URL = `https://www.openstreetmap.org/export/embed.html?bbox=${OSM_BBOX}&layer=mapnik&marker=${OSM_LAT},${OSM_LNG}`;
export const MAPS_ATTRIBUTION_URL = "https://www.openstreetmap.org/copyright";

export type MapsProvider = "google" | "osm";

/* Leaflet + tile CARTO aktif kalau NEXT_PUBLIC_CARTO_BASEMAPS_KEY terisi
   (gratis, fair use 5 jt tile/bln, atribusi OSM+CARTO melekat di kontrol peta).
   Tanpa key, komponen PetaLokasi fallback ke iframe OSM di bawah. */
export const PETA_INTERAKTIF = Boolean(process.env.NEXT_PUBLIC_CARTO_BASEMAPS_KEY?.trim());

export function mapsEmbed(): { url: string; provider: MapsProvider; title: string } {
 const key = process.env.NEXT_PUBLIC_GMAPS_EMBED_KEY?.trim();
 if (key) {
  return {
   url: `https://www.google.com/maps/embed/v1/place?key=${encodeURIComponent(key)}&q=${mapsQuery}&zoom=16`,
   provider: "google",
   title: `Lokasi ${SITE.nama} di Google Maps`,
  };
 }
 return { url: OSM_EMBED_URL, provider: "osm", title: `Lokasi ${SITE.nama} di OpenStreetMap` };
}
