"use server";
import { getTranslations } from 'next-intl/server';
import { getLocaleDariCookie } from '@/i18n/locale';

import { redirect, getPathname } from '@/i18n/navigation';
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/prisma/db";
import { auth } from "@/lib/auth";

const schema = (t: Awaited<ReturnType<typeof getTranslations<'auth'>>>) => z.object({
  nama: z.string({error: t('invalidField')}).trim().min(2, t('childNameMin')),
  tanggal_lahir: z
    .string({error: t('invalidField')})
    .regex(/^\d{4}-\d{2}-\d{2}$/, t('birthRequired'))
    .refine((v) => new Date(v) <= new Date(), t('birthFuture')),
  jenjang_terakhir: z.enum(["TK", "SD", "SMP", "SMA"], {error: t('invalidLevel')}),
  tingkat: z.string({error: t('invalidField')}).trim().min(1, t('invalidField')),
  email_notifikasi: z
    .string({error: t('invalidField')})
    .trim()
    .email(t('invalidEmailFormat'))
    .optional()
    .or(z.literal("")),
  nomor_telepon: z
    .string({error: t('phoneRequired')})
    .trim()
    .min(8, t('phoneMin') || "Nomor HP minimal 8 digit")
    .max(30, t('phoneMax'))
    .regex(/^[0-9+\-\s()]*$/, t('phoneCharacters')),
});

export type ChildInfoState = {
  error?: string;
  fieldErrors?: Record<string, string>;
  nama?: string;
  tanggal_lahir?: string;
  jenjang_terakhir?: string;
  tingkat?: string;
  email_notifikasi?: string;
  nomor_telepon?: string;
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
  const locale = await getLocaleDariCookie();
  const t = await getTranslations({locale, namespace: 'auth'});
  const ortuId = await guard();
  if (!ortuId) return { error: t('sessionExpired') };

  const namaKetik = String(formData.get("nama") ?? "");
  const jenjangKetik = String(formData.get("jenjang_terakhir") ?? "");
  const tingkatKetik = String(formData.get("tingkat") ?? "");
  const emailKetik = String(formData.get("email_notifikasi") ?? "");
  const teleponKetik = String(formData.get("nomor_telepon") ?? "");
  const parsed = schema(t).safeParse({
    nama: namaKetik,
    tanggal_lahir: formData.get("tanggal_lahir"),
    jenjang_terakhir: jenjangKetik,
    tingkat: tingkatKetik,
    email_notifikasi: emailKetik,
    nomor_telepon: teleponKetik,
  });
  if (!parsed.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsed.error.issues)
      fieldErrors[String(issue.path[0])] ??= issue.message;
    return {
      error: t('checkChild'),
      fieldErrors,
      nama: namaKetik,
      tanggal_lahir: String(formData.get("tanggal_lahir") ?? ""),
      jenjang_terakhir: jenjangKetik,
      tingkat: tingkatKetik,
      email_notifikasi: emailKetik,
      nomor_telepon: teleponKetik,
    };
  }
  const d = parsed.data;

  // Validasi keunikan nomor telepon jika berbeda dari nomor telepon orang tua
  const parent = await db.orm.public.User.where({ id: ortuId }).first();
  const hpOrtu = parent?.nomorTelepon?.trim() ?? "";
  const hpAnak = d.nomor_telepon.trim();

  if (hpAnak !== hpOrtu) {
    // 1. Cek apakah nomor telepon sudah terdaftar di akun User lain
    const userConflict = await db.orm.public.User.where({ nomorTelepon: hpAnak }).first();
    if (userConflict && userConflict.id !== ortuId) {
      return {
        error: t('checkChild'),
        fieldErrors: { nomor_telepon: t('phoneAlreadyUsed') },
        nama: namaKetik,
        tanggal_lahir: String(formData.get("tanggal_lahir") ?? ""),
        jenjang_terakhir: jenjangKetik,
        tingkat: tingkatKetik,
        email_notifikasi: emailKetik,
        nomor_telepon: teleponKetik,
      };
    }

    // 2. Cek apakah nomor telepon sudah terdaftar di Anak orang tua lain
    const anakConflict = await db.orm.public.Anak.where({ nomorTelepon: hpAnak }).first();
    if (anakConflict && anakConflict.orangTuaId !== ortuId) {
      return {
        error: t('checkChild'),
        fieldErrors: { nomor_telepon: t('phoneAlreadyUsed') },
        nama: namaKetik,
        tanggal_lahir: String(formData.get("tanggal_lahir") ?? ""),
        jenjang_terakhir: jenjangKetik,
        tingkat: tingkatKetik,
        email_notifikasi: emailKetik,
        nomor_telepon: teleponKetik,
      };
    }
  }

  await db.orm.public.Anak.create({
    orangTuaId: ortuId,
    nama: d.nama,
    tanggalLahir: d.tanggal_lahir,
    jenjangTerakhir: d.jenjang_terakhir,
    tingkat: d.tingkat,
    emailNotifikasi: d.email_notifikasi || null,
    nomorTelepon: d.nomor_telepon,
  });
  revalidatePath(getPathname({href: "/children", locale}));
  const redirectTo = String(formData.get("redirect_to") || "/home");
  return redirect({href: redirectTo, locale});
}

// C10 — edit anak. Saat ada kelas aktif, identitas legal (nama, tanggal lahir, jenjang)
// terlindungi dan tetap dipertahankan, sedangkan kontak & izin foto tetap dapat diperbarui.
export async function updateChild(
  _prev: ChildInfoState,
  formData: FormData,
): Promise<ChildInfoState> {
  const locale = await getLocaleDariCookie();
  const t = await getTranslations({locale, namespace: 'auth'});
  const ortuId = await guard();
  if (!ortuId) return { error: t('sessionExpired') };

  const anakId = Number(formData.get("anak_id"));
  if (!Number.isInteger(anakId) || anakId <= 0) return { error: t('invalidChild') };

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
  if (milikOrtu.length === 0) return { error: t('childNotFound') };
  const currentAnak = milikOrtu[0];

  const isTerkunci = await anakTerkunci(anakId);

  const emailKetik = String(formData.get("email_notifikasi") ?? "").trim();
  const teleponKetik = String(formData.get("nomor_telepon") ?? "").trim();
  const persetujuanFotoKetik = formData.get("persetujuan_foto") === "on" || formData.get("persetujuan_foto") === "true";

  // Validasi field kontak
  const contactSchema = z.object({
    email_notifikasi: z
      .string({ error: t('invalidField') })
      .trim()
      .email(t('invalidEmailFormat'))
      .optional()
      .or(z.literal("")),
    nomor_telepon: z
      .string({ error: t('phoneRequired') })
      .trim()
      .min(8, t('phoneMin') || "Nomor HP minimal 8 digit")
      .max(30, t('phoneMax'))
      .regex(/^[0-9+\-\s()]*$/, t('phoneCharacters')),
  });

  const parsedContact = contactSchema.safeParse({
    email_notifikasi: emailKetik,
    nomor_telepon: teleponKetik,
  });

  if (!parsedContact.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of parsedContact.error.issues) {
      fieldErrors[String(issue.path[0])] ??= issue.message;
    }
    return { error: t('checkChild'), fieldErrors };
  }

  // Validasi keunikan nomor telepon jika berbeda dari nomor telepon orang tua
  const parent = await db.orm.public.User.where({ id: ortuId }).first();
  const hpOrtu = parent?.nomorTelepon?.trim() ?? "";
  const hpAnak = teleponKetik;

  if (hpAnak !== hpOrtu) {
    // 1. Cek apakah nomor telepon sudah terdaftar di akun User lain
    const userConflict = await db.orm.public.User.where({ nomorTelepon: hpAnak }).first();
    if (userConflict && userConflict.id !== ortuId) {
      return { error: t('checkChild'), fieldErrors: { nomor_telepon: t('phoneAlreadyUsed') } };
    }

    // 2. Cek apakah nomor telepon sudah terdaftar di Anak lain (di luar anak ini sendiri)
    const anakConflict = await db.orm.public.Anak.where({ nomorTelepon: hpAnak }).first();
    if (anakConflict && anakConflict.id !== anakId && anakConflict.orangTuaId !== ortuId) {
      return { error: t('checkChild'), fieldErrors: { nomor_telepon: t('phoneAlreadyUsed') } };
    }
  }

  let finalNama = currentAnak.nama;
  let finalTanggalLahir = currentAnak.tanggalLahir;
  let finalJenjang = currentAnak.jenjangTerakhir;
  let finalTingkat = currentAnak.tingkat;

  if (!isTerkunci) {
    // Jika tidak terkunci, validasi dan perbarui seluruh field identitas
    const namaKetik = String(formData.get("nama") ?? "").trim();
    const jenjangKetik = String(formData.get("jenjang_terakhir") ?? "");
    const tingkatKetik = String(formData.get("tingkat") ?? "").trim();
    const tanggalLahirKetik = String(formData.get("tanggal_lahir") ?? "");

    const fullSchema = z.object({
      nama: z.string({ error: t('invalidField') }).trim().min(2, t('childNameMin')),
      tanggal_lahir: z
        .string({ error: t('invalidField') })
        .regex(/^\d{4}-\d{2}-\d{2}$/, t('birthRequired'))
        .refine((v) => new Date(v) <= new Date(), t('birthFuture')),
      jenjang_terakhir: z.enum(["TK", "SD", "SMP", "SMA"], { error: t('invalidLevel') }),
      tingkat: z.string({ error: t('invalidField') }).trim().min(1, t('invalidField')),
    });

    const parsedFull = fullSchema.safeParse({
      nama: namaKetik,
      tanggal_lahir: tanggalLahirKetik,
      jenjang_terakhir: jenjangKetik,
      tingkat: tingkatKetik,
    });

    if (!parsedFull.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsedFull.error.issues) {
        fieldErrors[String(issue.path[0])] ??= issue.message;
      }
      return { error: t('checkChild'), fieldErrors };
    }

    finalNama = parsedFull.data.nama;
    finalTanggalLahir = parsedFull.data.tanggal_lahir;
    finalJenjang = parsedFull.data.jenjang_terakhir;
    finalTingkat = parsedFull.data.tingkat;
  }

  // Update DB
  await db.orm.public.Anak.where({ id: anakId }).update({
    nama: finalNama,
    tanggalLahir: finalTanggalLahir,
    jenjangTerakhir: finalJenjang,
    tingkat: finalTingkat,
    emailNotifikasi: emailKetik || null,
    nomorTelepon: hpAnak,
    persetujuanFoto: persetujuanFotoKetik,
  });

  // Jika status persetujuan foto berubah, catat ke audit log
  if (currentAnak.persetujuanFoto !== persetujuanFotoKetik) {
    await db.orm.public.AuditPerubahan.create({
      entitas: "anak_persetujuan_foto",
      entitasId: anakId,
      aksi: "update_persetujuan_foto",
      sebelum: JSON.stringify({ persetujuanFoto: currentAnak.persetujuanFoto }),
      sesudah: JSON.stringify({ persetujuanFoto: persetujuanFotoKetik }),
      alasan: "Pembaruan profil anak oleh orang tua",
      aktorId: ortuId,
      createdAt: new Date().toISOString(),
    });
  }

  revalidatePath(getPathname({href: "/children", locale}));
  return redirect({href: "/children", locale});
}
