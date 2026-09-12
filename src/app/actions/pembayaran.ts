"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
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
  const session = await auth();
  if (!session?.user || session.user.role !== "orang_tua")
    return { ok: false, error: "Sesi berakhir. Masuk ulang." };

  const pembayaranId = Number(formData.get("pembayaran_id"));
  if (!Number.isInteger(pembayaranId))
    return { ok: false, error: "Tagihan tidak valid." };

  const [b] = await collect(
    db.orm.public.Pembayaran.where((x) => x.id.eq(pembayaranId)).all(),
  );
  if (!b) return { ok: false, error: "Tagihan tidak ditemukan." };
  if (b.status === "berhasil")
    return { ok: false, error: "Tagihan ini sudah lunas." };

  const [p] = await collect(
    db.orm.public.Pendaftaran.where((x) => x.id.eq(b.pendaftaranId)).all(),
  );
  const [a] = p
    ? await collect(db.orm.public.Anak.where((x) => x.id.eq(p.anakId)).all())
    : [];
  if (!a || a.orangTuaId !== Number(session.user.id))
    return { ok: false, error: "Tagihan ini bukan milik akun Anda." };

  const origin = process.env.AUTH_URL ?? "http://localhost:3000";
  try {
    const snap = await snapCreate({
      orderId: ORDER_ID(pembayaranId),
      grossAmount: Number(b.jumlah),
      email: session.user.email ?? undefined,
      firstName: session.user.name ?? undefined,
      description: `Siedu ${b.tipe === "cicilan" ? `cicilan ke-${b.cicilanKe}` : b.tipe} — ${a.nama}`,
      finishUrl: `${origin}/enrollments/${b.pendaftaranId}/payment-result?pembayaran=${pembayaranId}`,
    });
    return { ok: true, url: snap.redirect_url };
  } catch (e) {
    console.error("[mulaiPembayaran] gateway gagal:", e);
    return {
      ok: false,
      error:
        "Pintu pembayaran tidak bisa dihubungi. Coba lagi, atau gunakan instruksi transfer manual.",
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

const batalSchema = z.object({
  pendaftaran_id: z.coerce.number().int().positive(),
  kategori: z.enum([
    "kesalahan_sistem",
    "salah_nominal_transfer",
    "salah_rekening",
    "salah_pilih_kelas",
    "lainnya",
  ]),
  alasan: z.string().trim().min(10, "Jelaskan minimal 10 karakter.").max(1000),
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
  const session = await auth();
  if (!session?.user || session.user.role !== "orang_tua")
    return { error: "Sesi berakhir. Masuk ulang." };

  const parsed = batalSchema.safeParse({
    pendaftaran_id: formData.get("pendaftaran_id"),
    kategori: formData.get("kategori"),
    alasan: formData.get("alasan"),
  });
  if (!parsed.success)
    return { error: parsed.error.issues[0]?.message ?? "Isian tidak valid." };
  const { pendaftaran_id, kategori, alasan } = parsed.data;

  const [p] = await collect(
    db.orm.public.Pendaftaran.where((x) => x.id.eq(pendaftaran_id)).all(),
  );
  if (!p) return { error: "Pendaftaran tidak ditemukan." };
  if (!["menunggu_pembayaran", "terdaftar", "tertunggak"].includes(p.status))
    return { error: "Pendaftaran ini sudah berakhir — tidak bisa dibatalkan." };

  const [a] = await collect(
    db.orm.public.Anak.where((x) => x.id.eq(p.anakId)).all(),
  );
  if (!a || a.orangTuaId !== Number(session.user.id))
    return { error: "Pendaftaran ini bukan milik akun Anda." };

  const antrian = await collect(
    db.orm.public.PengajuanPembatalan.where((x) =>
      x.pendaftaranId.eq(pendaftaran_id),
    ).all(),
  );
  if (antrian.some((x) => x.status === "menunggu"))
    return { error: "Pengajuan masih menunggu keputusan admin." };

  try {
    await db.orm.public.PengajuanPembatalan.create({
      pendaftaranId: pendaftaran_id,
      diajukanOleh: Number(session.user.id),
      kategori,
      alasan,
    });
  } catch (e) {
    if (e instanceof Error && e.message.includes("pengajuan_menunggu_unik"))
      return { error: "Pengajuan masih menunggu keputusan admin." };
    throw e;
  }
  revalidatePath("/admin/refunds");
  return { ok: true };
}
