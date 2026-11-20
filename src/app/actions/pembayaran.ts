"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { getLocaleDariCookie } from "@/i18n/locale";
import { getPathname, redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { snapCreate, midtransConfigured } from "@/lib/midtrans";
import { ORDER_ID, tandaiBerhasil } from "@/lib/services/pembayaran";

export type PayState =
  | {
      ok: true;
      token: string;
      redirectUrl: string;
      url: string;
    }
  | {
      ok: false;
      error: string;
    };

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
  if (!p || p.status.startsWith("dibatalkan"))
    return { ok: false, error: t("payment.cancelled") };
  const [a] = await collect(db.orm.public.Anak.where((x) => x.id.eq(p.anakId)).all());
  if (!a || a.orangTuaId !== Number(session.user.id))
    return { ok: false, error: t("payment.ownership") };

  const headerList = await headers();
  const host = headerList.get("x-forwarded-host") || headerList.get("host");
  const proto = headerList.get("x-forwarded-proto") || "http";
  const origin = process.env.AUTH_URL || (host ? `${proto}://${host}` : "http://localhost:3000");

  const orderId = `${ORDER_ID(pembayaranId)}-${Date.now()}`;
  const finishUrl = `${origin}${getPathname({ locale, href: `/enrollments/${b.pendaftaranId}/payment-result` })}?pembayaran=${pembayaranId}`;
  const unfinishUrl = `${origin}${getPathname({ locale, href: `/enrollments/${b.pendaftaranId}` })}`;
  const errorUrl = `${origin}${getPathname({ locale, href: `/enrollments/${b.pendaftaranId}` })}?error=payment_failed`;

  try {
    const snap = await snapCreate({
      orderId,
      grossAmount: Number(b.jumlah),
      email: session.user.email ?? undefined,
      firstName: session.user.name ?? undefined,
      description: t("payment.description", {
        type: b.tipe === "cicilan" ? t("payment.installment", { number: b.cicilanKe ?? 0 })
          : b.tipe === "dp" || b.tipe === "lunas" ? t(`payment.${b.tipe}`) : b.tipe,
        name: a.nama,
      }),
      finishUrl,
      unfinishUrl,
      errorUrl,
    });

    await db.orm.public.Pembayaran.where({ id: pembayaranId }).update({
      referensiGateway: orderId,
      ...(b.status === "gagal" ? { status: "pending" } : {}),
      updatedAt: new Date().toISOString(),
    });

    return {
      ok: true,
      token: snap.token,
      redirectUrl: snap.redirect_url,
      url: snap.redirect_url,
    };
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
  if (!p || p.status.startsWith("dibatalkan")) return;
  const [a] = await collect(
    db.orm.public.Anak.where((x) => x.id.eq(p.anakId)).all(),
  );
  if (!a || a.orangTuaId !== Number(session.user.id)) return;

  const r = await tandaiBerhasil(pembayaranId);
  if (!r.ok) return;
  revalidatePath("/home");
  revalidatePath("/payments");
  revalidatePath(`/enrollments/${pendaftaranId}`);

  const redirectTo = formData.get("redirect_to") as string | null;
  if (redirectTo === "none") {
    return;
  }

  const locale = await getLocaleDariCookie();
  const defaultTarget = `/enrollments/${pendaftaranId}/payment-result?pembayaran=${pembayaranId}`;

  if (redirectTo) {
    const safeRedirect =
      redirectTo.startsWith("/") && !redirectTo.startsWith("//") && !redirectTo.includes("\\")
        ? redirectTo
        : defaultTarget;
    redirect({ href: safeRedirect, locale });
  }

  redirect({
    href: defaultTarget,
    locale,
  });
}
