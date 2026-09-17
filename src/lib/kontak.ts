/* Subjek pesan formulir Kontak (A7) — module polos, dipakai bersama oleh
 * server action (validasi zod) dan ContactForm (opsi <select>).
 * TIDAK boleh diekspor dari file 'use server' — nilai non-fungsi tidak bisa
 * menyeberang RSC boundary (SUBJEK.map is not a function, terbukti 12 Sep). */
export const SUBJEK = [
 'Pendaftaran',
 'Program Belajar',
 'Fasilitas',
 'Biaya',
 'Saran/Masukan/Keluhan',
] as const;

export type SubjekPesan = (typeof SUBJEK)[number];
