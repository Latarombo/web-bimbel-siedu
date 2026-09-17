/**
 * Konten halaman /privacy-policy sebagai data, bukan JSX.
 * `**teks**` di dalam string dirender tebal oleh halaman. Sumber fakta:
 * src/prisma/contract.prisma, src/lib/services/*, src/lib/site.ts.
 */
import { SITE } from "./site";

export type BlokPrivasi =
 | { jenis: "p"; teks: string }
 | { jenis: "ul"; poin: string[] };

export function getPrivasi(tr: (key: string, values?: Record<string, string | number>) => string) {
const PRIVASI_META = {
 judul: tr("text324"),
 ringkasan:
 tr("text325"),
 diperbarui: tr("text326"),
 waktuBaca: tr("text327"),
} as const;

const PRIVASI_SECTIONS: { id: string; judul: string; blok: BlokPrivasi[] }[] = [
 {
 id: "data",
 judul: tr("text328"),
 blok: [
 { jenis: "p", teks: tr("text329") },
 {
 jenis: "ul",
 poin: [
 tr("text330"),
 tr("text331"),
 tr("text332"),
 tr("text333"),
 ],
 },
 { jenis: "p", teks: tr("text334") },
 ],
 },
 {
 id: "anak",
 judul: tr("text335"),
 blok: [
 {
 jenis: "p",
 teks: tr("text336"),
 },
 ],
 },
 {
 id: "persetujuan",
 judul: tr("text337"),
 blok: [
 { jenis: "p", teks: tr("text338") },
 {
 jenis: "ul",
 poin: [
 tr("text339"),
 tr("text340"),
 ],
 },
 { jenis: "p", teks: tr("text341") },
 ],
 },
 {
 id: "penggunaan",
 judul: tr("text342"),
 blok: [
 {
 jenis: "p",
 teks: tr("text343"),
 },
 ],
 },
 {
 id: "pembayaran",
 judul: tr("text344"),
 blok: [
 {
 jenis: "p",
 teks: tr("text345"),
 },
 ],
 },
 {
 id: "pihak-ketiga",
 judul: tr("text346"),
 blok: [
 {
 jenis: "p",
 teks: tr("text347"),
 },
 ],
 },
 {
 id: "retensi-hak",
 judul: tr("text348"),
 blok: [
 { jenis: "p", teks: tr("text349") },
 {
 jenis: "ul",
 poin: [
 tr("text350"),
 tr("text351"),
 tr("text352"),
 ],
 },
 ],
 },
 {
 id: "keamanan",
 judul: tr("text353"),
 blok: [
 {
 jenis: "p",
 teks: tr("text354"),
 },
 ],
 },
 {
 id: "perubahan",
 judul: tr("text355"),
 blok: [
 {
 jenis: "p",
 teks: tr("text356"),
 },
 ],
 },
 {
 id: "kontak",
 judul: tr("text357"),
 blok: [
 {
 jenis: "p",
 teks: tr("privacyContact", {email: SITE.email, phone: SITE.telepon}),
 },
 ],
 },
];

return { meta: PRIVASI_META, sections: PRIVASI_SECTIONS };
}
