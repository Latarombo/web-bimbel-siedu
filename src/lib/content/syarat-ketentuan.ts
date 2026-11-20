/**
 * Konten halaman /terms sebagai data, bukan JSX.
 * `**teks**` di dalam string dirender tebal oleh halaman. Sumber fakta:
 * src/prisma/contract.prisma, src/lib/services/*, src/app/actions/*.
 */
import { SITE } from "./site";

export type BlokSyarat =
 | { jenis: "p"; teks: string }
 | { jenis: "ul"; poin: string[] };

export function getSyarat(tr: (key: string, values?: Record<string, string | number>) => string) {
const SYARAT_META = {
 judul: tr("text358"),
 ringkasan:
 tr("text359"),
 diperbarui: tr("text360"),
 waktuBaca: tr("text361"),
} as const;

const SYARAT_SECTIONS: { id: string; judul: string; blok: BlokSyarat[] }[] = [
 {
 id: "cakupan",
 judul: tr("text362"),
 blok: [
 { jenis: "p", teks: tr("text363") },
 { jenis: "p", teks: tr("text364") },
 ],
 },
 {
 id: "akun",
 judul: tr("text365"),
 blok: [
 { jenis: "p", teks: tr("text366") },
 { jenis: "ul", poin: [
 tr("text367"),
 tr("text368"),
 tr("text369"),
 ], },
 ],
 },
 {
 id: "penggunaan",
 judul: tr("text370"),
 blok: [
 { jenis: "p", teks: tr("text371") },
 ],
 },
 {
 id: "pendaftaran",
 judul: tr("text372"),
 blok: [
 { jenis: "p", teks: tr("text373") },
 { jenis: "ul", poin: [
 tr("text374"),
 tr("text375"),
 tr("text376"),
 tr("text377"),
 ], },
 ],
 },
 {
 id: "pembayaran",
 judul: tr("text378"),
 blok: [
 { jenis: "p", teks: tr("text379") },
 { jenis: "ul", poin: [
 tr("text380"),
 tr("text381"),
 tr("text382"),
 tr("text383"),
 tr("text384"),
 ], },
 ],
 },
 {
 id: "pembatalan",
 judul: tr("text385"),
 blok: [
 { jenis: "p", teks: tr("text386") },
 { jenis: "ul", poin: [
 tr("text387"),
 tr("text388"),
 tr("text389"),
 tr("text390"),
 ], },
 ],
 },
 {
 id: "presensi",
 judul: tr("text391"),
 blok: [
 { jenis: "p", teks: tr("text392") },
 ],
 },
 {
 id: "lembaga",
 judul: tr("text393"),
 blok: [
 { jenis: "p", teks: tr("text394") },
 ],
 },
 {
 id: "tanggung-jawab",
 judul: tr("text395"),
 blok: [
 { jenis: "p", teks: tr("text396") },
 ],
 },
 {
 id: "privasi",
 judul: tr("text397"),
 blok: [
 { jenis: "p", teks: tr("text398") },
 ],
 },
 {
 id: "perubahan",
 judul: tr("text399"),
 blok: [
 { jenis: "p", teks: tr("text400") },
 ],
 },
 {
 id: "hukum",
 judul: tr("text401"),
 blok: [
 { jenis: "p", teks: tr("text402") },
 ],
 },
 {
 id: "kontak",
 judul: tr("text403"),
 blok: [
 { jenis: "p", teks: tr("termsContact", {email: SITE.email, phone: SITE.telepon}) },
 ],
 },
];

return { meta: SYARAT_META, sections: SYARAT_SECTIONS };
}
