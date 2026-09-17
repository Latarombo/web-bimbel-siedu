"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getTranslations } from "next-intl/server";
import { getLocaleDariCookie } from "@/i18n/locale";
import { getPathname } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { snapCreate, midtransConfigured } from "@/lib/midtrans";
import { ORDER_ID, tandaiBerhasil } from "@/lib/services/pembayaran";

export type PayState = { ok: true; url: string } | { ok: false; error: string };

/**
 * Buat transaksi Midtrans SNAP untuk satu Pembayaran milik orang tua login,
 * lalu UI redirect ke snap_url. Guard kepemilikan RSC yang sama dengan
 * konfirmasi manual. Gagal gateway → error ramah (UI tetap bisa fallback).
 */
export async function mulaiPembayaran(
  _prev: PayState,
  formData: FormData,
): Promise<PayState> {
  const locale = await getLocaleDariCookie();
  const t = await getTranslations({ locale, namespace: "adminForms" });
  const session = await auth();
  if (!session?.user || session.user.role !== "orang_tua")
    return { ok: false, error: t("validation.session") };

  const pembayaranId = Number(formData.get("pembayaran_id"));
  if (!Number.isInteger(pembayaranId))
    return { ok: false, error: t("payment.invalid") };

  const [b] = await collect(
    db.orm.public.Pembayaran.where((x) => x.id.eq(pembayaranId)).all(),
  );
  if (!b) return { ok: false, error: t("payment.missing") };
  if (b.status === "berhasil")
    return { ok: false, error: t("payment.paid") };

  const [p] = await collect(
    db.orm.public.Pendaftaran.where((x) => x.id.eq(b.pendaftaranId)).all(),
  );
  const [a] = p
    ? await collect(db.orm.public.Anak.where((x) => x.id.eq(p.anakId)).all())
    : [];
  if (!a || a.orangTuaId !== Number(session.user.id))
    return { ok: false, error: t("payment.ownership") };

  const origin = process.env.AUTH_URL ?? "http://localhost:3000";
  try {
    const snap = await snapCreate({
      orderId: ORDER_ID(pembayaranId),
      grossAmount: Number(b.jumlah),
      email: session.user.email ?? undefined,
      firstName: session.user.name ?? undefined,
      description: t("payment.description", {
        type: b.tipe === "cicilan" ? t("payment.installment", { number: b.cicilanKe ?? 0 })
          : b.tipe === "dp" || b.tipe === "lunas" ? t(`payment.${b.tipe}`) : b.tipe,
        name: a.nama,
      }),
      finishUrl: `${origin}${getPathname({ locale, href: `/enrollments/${b.pendaftaranId}/payment-result` })}?pembayaran=${pembayaranId}`,
    });
    return { ok: true, url: snap.redirect_url };
  } catch (e) {
    console.error("[mulaiPembayaran] gateway gagal:", e);
    return {
      ok: false,
      error:
        t("payment.gateway"),
    };
  }
}

/**
 * Konfirmasi manual — HANYA saat gateway belum dikonfigurasi (dev / transfer
 * manual lembaga). Menandai berhasil lewat service yang sama dengan webhook
 * (tandaiBerhasil): cicilan berikutnya terbit + status pendaftaran naik
 * sendiri. Dengan gateway aktif, action ini menolak — satu-satunya jalan
 * menjadi 'berhasil' adalah webhook terverifikasi signature.
 */
export async function konfirmasiManual(formData: FormData): Promise<void> {
  if (midtransConfigured()) return;
  const session = await auth();
  if (!session?.user || session.user.role !== "orang_tua") return;
  const pembayaranId = Number(formData.get("pembayaran_id"));
  const pendaftaranId = Number(formData.get("pendaftaran_id"));
  if (!Number.isInteger(pembayaranId) || !Number.isInteger(pendaftaranId))
    return;

  const [b] = await collect(
    db.orm.public.Pembayaran.where((x) => x.id.eq(pembayaranId)).all(),
  );
  if (!b || b.pendaftaranId !== pendaftaranId) return;
  const [p] = await collect(
    db.orm.public.Pendaftaran.where((x) => x.id.eq(pendaftaranId)).all(),
  );
  if (!p) return;
  const [a] = await collect(
    db.orm.public.Anak.where((x) => x.id.eq(p.anakId)).all(),
  );
  if (!a || a.orangTuaId !== Number(session.user.id)) return;

  const r = await tandaiBerhasil(pembayaranId);
  if (!r.ok) return;
  revalidatePath("/home");
  revalidatePath("/payments");
  revalidatePath(`/enrollments/${pendaftaranId}`);
}

// --- Pembatalan (C7) ---

export type BatalState = { ok?: boolean; error?: string };

const batalSchema = (t: Awaited<ReturnType<typeof getTranslations>>) => z.object({
  pendaftaran_id: z.coerce.number().int().positive(),
  kategori: z.enum([
    "kesalahan_sistem",
    "salah_nominal_transfer",
    "salah_rekening",
    "salah_pilih_kelas",
    "lainnya",
  ], t("validation.invalid")),
  alasan: z.string().trim().min(10, t("validation.reasonMin")).max(1000, t("validation.reasonMax")),
});

/**
 * Ajukan pembatalan → baris PengajuanPembatalan 'menunggu'; eksekusi
 * (status Pendaftaran + lepas kuota) di tangan admin lewat /admin/refunds
 * (prosesPengajuan). Guard: masih aktif, milik orang tua login, belum ada
 * pengajuan menunggu (unique partial DB dicegah lebih awal → pesan ramah).
 */
export async function ajukanPembatalan(
  _prev: BatalState,
  formData: FormData,
): Promise<BatalState> {
  const locale = await getLocaleDariCookie();
  const t = await getTranslations({ locale, namespace: "adminForms" });
  const session = await auth();
  if (!session?.user || session.user.role !== "orang_tua")
    return { error: t("validation.session") };

  const parsed = batalSchema(t).safeParse({
    pendaftaran_id: formData.get("pendaftaran_id"),
    kategori: formData.get("kategori"),
    alasan: formData.get("alasan"),
  }, { error: () => t("validation.invalid") });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? t("validation.invalid") };
  const { pendaftaran_id, kategori, alasan } = parsed.data;

  const [p] = await collect(
    db.orm.public.Pendaftaran.where((x) => x.id.eq(pendaftaran_id)).all(),
  );
  if (!p) return { error: t("payment.enrollmentMissing") };
  if (!["menunggu_pembayaran", "terdaftar", "tertunggak"].includes(p.status))
    return { error: t("payment.ended") };

  const [a] = await collect(
    db.orm.public.Anak.where((x) => x.id.eq(p.anakId)).all(),
  );
  if (!a || a.orangTuaId !== Number(session.user.id))
    return { error: t("payment.enrollmentOwnership") };

  const antrian = await collect(
    db.orm.public.PengajuanPembatalan.where((x) =>
      x.pendaftaranId.eq(pendaftaran_id),
    ).all(),
  );
  if (antrian.some((x) => x.status === "menunggu"))
    return { error: t("payment.awaiting") };

  try {
    await db.orm.public.PengajuanPembatalan.create({
      pendaftaranId: pendaftaran_id,
      diajukanOleh: Number(session.user.id),
      kategori,
      alasan,
    });
  } catch (e) {
    if (e instanceof Error && e.message.includes("pengajuan_menunggu_unik"))
      return { error: t("payment.awaiting") };
    throw e;
  }
  revalidatePath("/admin/refunds");
  return { ok: true };
}
