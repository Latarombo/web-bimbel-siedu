import type { Adapter, AdapterUser } from 'next-auth/adapters';
import { db } from '@/prisma/db';

// Adapter Auth.js v5 custom untuk kontrak Prisma Next (tanpa tabel Account —
// link OAuth disimpan sebagai users.google_sub, cukup untuk satu provider).
// Hanya method yang dipakai alur OAuth yang diimplementasikan; jalur credentials
// TIDAK menyentuh adapter (diverifikasi dari @auth/core callback/index.js).
//
// PENTING: setiap method mengembalikan `id` sebagai STRING id integer DB —
// token JWT lalu membawa id DB asli (bukan google sub), sehingga semua query
// area parent (Anak.orangTuaId dll.) tetap menerima id yang benar.
//
// Perluasan modul next-auth di src/types/next-auth.d.ts menambahkan `role`
// pada interface User → properti wajib juga di AdapterUser.

type UserRow = {
  id: number | string;
  role: 'admin' | 'guru' | 'orang_tua';
  name: string;
  email: string;
  emailVerifiedAt: string | null;
  googleSub: string | null;
};

function toAdapterUser(row: UserRow): AdapterUser {
  return {
    id: String(row.id),
    role: row.role,
    name: row.name,
    email: row.email,
    emailVerified: row.emailVerifiedAt ? new Date(row.emailVerifiedAt) : null,
    image: null,
  };
}

export const prismaNextAdapter: Adapter = {
  async createUser({ name, email }) {
    // Registrasi via Google = orang tua (v1). Password diisi acak: bcrypt.compare
    // tidak akan pernah cocok dengan password apa pun, jadi akun Google tidak
    // bisa dimasuki lewat jalur password.
    const row = await db.orm.public.User.create({
      role: 'orang_tua',
      name: name ?? email.split('@')[0],
      email,
      password: crypto.randomUUID(),
    });
    return toAdapterUser(row);
  },

  async getUser(id) {
    const row = await db.orm.public.User.where({ id: Number(id) }).first();
    return row ? toAdapterUser(row) : null;
  },

  async getUserByEmail(email) {
    const normalized = email.trim().toLowerCase();
    const row = await db.orm.public.User
      .where((u) => u.email.eq(normalized))
      .first();
    return row ? toAdapterUser(row) : null;
  },

  async getUserByAccount({ provider, providerAccountId }) {
    if (provider !== 'google') return null;
    const row = await db.orm.public.User
      .where((u) => u.googleSub.eq(providerAccountId))
      .first();
    return row ? toAdapterUser(row) : null;
  },

  async updateUser({ id, name, email }) {
    const row = await db.orm.public.User.where({ id: Number(id) }).update({
      ...(name != null ? { name } : {}),
      ...(email != null ? { email } : {}),
      updatedAt: new Date().toISOString(),
    });
    if (!row) throw new Error(`Adapter updateUser: user ${id} tidak ditemukan`);
    return toAdapterUser(row);
  },

  // Dipanggil core SETELAH createUser / setelah resolve user existing —
  // jadi titik yang tepat untuk menyimpan link provider (google_sub).
  // emailVerifiedAt ikut diisi: email Google sudah terverifikasi Google.
  async linkAccount(account) {
    if (account.provider !== 'google' || !account.providerAccountId) return;
    await db.orm.public.User.where({ id: Number(account.userId) }).update({
      googleSub: account.providerAccountId,
      emailVerifiedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  },
};
