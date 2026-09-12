"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/prisma/db";
import { auth } from "@/lib/auth";

const schema = z.object({
  nama: z.string().trim().min(2, "Nama anak minimal 2 karakter"),
  tanggal_lahir: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Tanggal lahir wajib diisi")
    .refine((v) => new Date(v) <= new Date(), "Tanggal lahir tidak boleh di masa depan"),
  jenjang_terakhir: z.enum(["TK", "SD", "SMP", "SMA"]),
  email_notifikasi: z.string().trim().email().optional().or(z.literal("")),
  nomor_telepon: z.string().trim().max(30).optional().or(z.literal("")),
});

export type ChildInfoState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  nama?: string;
  jenjang_terakhir?: string;
};

async function guard() {
  const session = await auth();
  if (!session?.user || session.user.role !== "orang_tua") return null;
  return Number(session.user.id);
}

// PRD F2 / Keputusan #5 — profil anak read-only saat ada pendaftaran aktif.
async function anakTerkunci(anakId: number): Promise<boolean> {
  const collect = async <T,>(src: AsyncIterable<T>) => {
    const out: T[] = [];
    for await (const r of src) out.push(r);
    return out;
  };
  const rows = await collect(
    db.orm.public.Pendaftaran.where((p) => p.anakId.eq(anakId)).all(),
  );
  return rows.some((p) =>
    ["menunggu_pembayaran", "terdaftar", "tertunggak"].includes(p.status),
  );
}

// PRD F2 — profil anak pertama setelah registrasi (BR#25: email_notifikasi hanya utk notifikasi).
export async function saveChildInfo(
  _prev: ChildInfoState,
  formData: FormData,
): Promise<ChildInfoState> {
  const ortuId = await guard();
  if (!ortuId) return { error: "Sesi berakhir. Masuk ulang." };

  const namaKetik = String(formData.get("nama") ?? "");
  const jenjangKetik = String(formData.get("jenjang_terakhir") ?? "");
  const parsed = schema.safeParse({
    nama: namaKetik,
    tanggal_lahir: formData.get("tanggal_lahir"),
    jenjang_terakhir: jenjangKetik,
    email_notifikasi: String(formData.get("email_notifikasi") ?? ""),
    nomor_telepon: String(formData.get("nomor_telepon") ?? ""),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: "Periksa lagi isian profil anak.", fieldErrors, nama: namaKetik, jenjang_terakhir: jenjangKetik };
  }
  const d = parsed.data;

  await db.orm.public.Anak.create({
    orangTuaId: ortuId,
    nama: d.nama,
    tanggalLahir: d.tanggal_lahir,
    jenjangTerakhir: d.jenjang_terakhir,
    emailNotifikasi: d.email_notifikasi || null,
    nomorTelepon: d.nomor_telepon || null,
  });
  redirect("/home");
}

// C10 — edit anak. Ditolak kalau ada pendaftaran aktif (Keputusan #5).
export async function updateChild(
  _prev: ChildInfoState,
  formData: FormData,
): Promise<ChildInfoState> {
  const ortuId = await guard();
  if (!ortuId) return { error: "Sesi berakhir. Masuk ulang." };

  const anakId = Number(formData.get("anak_id"));
  if (!Number.isInteger(anakId) || anakId <= 0) return { error: "Anak tidak valid." };

  if (await anakTerkunci(anakId))
    return {
      error:
        "Profil anak terkunci karena ada pendaftaran aktif. Hubungi admin untuk koreksi.",
    };

  const parsed = schema.safeParse({
    nama: formData.get("nama"),
    tanggal_lahir: formData.get("tanggal_lahir"),
    jenjang_terakhir: formData.get("jenjang_terakhir"),
    email_notifikasi: String(formData.get("email_notifikasi") ?? ""),
    nomor_telepon: String(formData.get("nomor_telepon") ?? ""),
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      fieldErrors[String(issue.path[0])] ??= issue.message;
    return { error: "Periksa lagi isian profil anak.", fieldErrors };
  }
  const d = parsed.data;

  const collect = async <T,>(src: AsyncIterable<T>) => {
    const out: T[] = [];
    for await (const r of src) out.push(r);
    return out;
  };

  const milikOrtu = await collect(
    db.orm.public.Anak.where((a) => a.id.eq(anakId))
      .where((a) => a.orangTuaId.eq(ortuId))
      .all(),
  );
  if (milikOrtu.length === 0) return { error: "Anak tidak ditemukan." };

  await db.orm.public.Anak.where({ id: anakId }).update({
    nama: d.nama,
    tanggalLahir: d.tanggal_lahir,
    jenjangTerakhir: d.jenjang_terakhir,
    emailNotifikasi: d.email_notifikasi || null,
    nomorTelepon: d.nomor_telepon || null,
  });
  revalidatePath("/children");
  redirect("/children");
}
