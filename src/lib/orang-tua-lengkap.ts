import { cache } from 'react';
import { db } from '@/prisma/db';

/**
 * Penanda "informasi orang tua belum dilengkapi" = cap consent milik PRD F1/BR#25
 * (privasiDisetujuiAt / waliDisetujuiAt). Kap ini HANYA ditulis saveAccountInfo
 * (step 2 wizard), jadi ia sahih sebagai bukti user melewati halaman
 * /register/account-info — tidak bisa dipalsukan dari sisi UI.
 *
 * Sengaja TIDAK memakai nomorTelepon: kolom itu NOT NULL (BR#32) dan berisi
 * placeholder '' / '+62-000-0000-0000' hasil backfill migrasi untuk akun lama,
 * jadi kosong ≠ belum melengkapi.
 *
 * cache() = dedupe per request: layout (gate) + halaman + server action boleh
 * memanggil tanpa query ganda.
 */
export const orangTuaBelumLengkap = cache(async (ortuId: number): Promise<boolean> => {
  const user = await db.orm.public.User.where({ id: ortuId }).first();
  // Baris hilang ( akun dihapus admin ) → anggap belum lengkap; halaman tujuan
  // sudah punya tembok sendiri yang mengirim user ke /login.
  if (!user) return true;
  return !user.privasiDisetujuiAt || !user.waliDisetujuiAt;
});

/** Tujuan paksa untuk orang tua yang belum menuntaskan step 2. */
export const AKUN_INFO_PATH = '/register/account-info';

/**
 * Rumah tujuan sesuai role — versi "tahu kelengkapan akun" dari homeFor().
 * Orang tua yang belum menuntaskan step 2 dikirim ke step 2, bukan /home,
 * supaya login ulang tidak terasa seperti jalan buntu di dashboard kosong.
 */
export async function homeUntukUser(user: {
 id: number;
 role: 'admin' | 'guru' | 'orang_tua';
}): Promise<string> {
 if (user.role === 'admin') return '/admin/dashboard';
 if (user.role === 'guru') return '/teacher/dashboard';
 return (await orangTuaBelumLengkap(user.id)) ? AKUN_INFO_PATH : '/home';
}
