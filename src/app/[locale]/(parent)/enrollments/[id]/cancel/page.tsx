import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { rupiah } from "@/lib/format";
import { SITE } from "@/lib/site";
import CancelForm from "@/components/parent/cancel-form";

export const dynamic = "force-dynamic";

// C7 — Ajukan pembatalan. Orang tua hanya MENGAJUKAN; keputusan (setuju/tolak
// + catatan) di admin /admin/refunds (BR#19). Halaman ini menampilkan ringkasan
// yang hilang kalau pembatalan disetujui, lalu form-nya.

const AKTIF = ["menunggu_pembayaran", "terdaftar", "tertunggak"];

export default async function CancelPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tr = await getTranslations("parent");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) {
    return redirect({href: "/login?next=/home", locale});
  }
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isInteger(pid)) notFound();

  const [p] = await collect(
    db.orm.public.Pendaftaran.where((x) => x.id.eq(pid)).all(),
  );
  if (!p) notFound();
  const [a, k] = await Promise.all([
    collect(db.orm.public.Anak.where((x) => x.id.eq(p.anakId)).all()),
    collect(db.orm.public.Kelas.where((x) => x.id.eq(p.kelasId)).all()),
  ]);
  if (!a[0] || a[0].orangTuaId !== Number(session.user.id)) notFound();

  // Sudah batal → tidak ada yang bisa diajukan lagi.
  if (!AKTIF.includes(p.status)) redirect({href: `/enrollments/${pid}`, locale});

  // Pengajuan menunggu sudah ada → redirect ke detail yang memasang banner.
  const pengajuan = await collect(
    db.orm.public.PengajuanPembatalan.where((x) =>
      x.pendaftaranId.eq(pid),
    ).all(),
  );
  if (pengajuan.some((x) => x.status === "menunggu"))
    redirect({href: `/enrollments/${pid}`, locale});

  const tagihan = await collect(
    db.orm.public.Pembayaran.where((b) => b.pendaftaranId.eq(pid)).all(),
  );
  const dibayar = tagihan
    .filter((b) => b.status === "berhasil")
    .reduce((s, b) => s + Number(b.jumlah), 0);
  const terbuka = tagihan
    .filter((b) => b.status === "pending" || b.status === "gagal")
    .reduce((s, b) => s + Number(b.jumlah), 0);
  const mapel = k[0]
    ? (
        await collect(
          db.orm.public.MataPelajaran.where((m) =>
            m.id.eq(k[0].mataPelajaranId),
          ).all(),
        )
      )[0]?.nama
    : null;

  return (
    <div className="mx-auto max-w-xl px-4 sm:px-6 lg:px-8 py-10">
      <p className="text-sm text-muted">
        <Link href={`/enrollments/${pid}`} className="underline">
           {tr("text016")} </Link>
      </p>
      <header className="mt-3">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{tr("text017")}</h1>
        <p className="mt-1 text-sm text-muted">
          {a[0].nama} · {mapel ?? `Kelas #${p.kelasId}`} ·{" "}
          <Badge tone="slate">{p.status.replaceAll("_", " ")}</Badge>
        </p>
      </header>

      <Card className="mt-6">
        <CardPad>
          <p className="text-sm font-semibold">
             {tr("text018")} </p>
          <ul className="mt-3 grid gap-2 text-sm text-muted">
            <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-slate-100 pt-2">
              <span>{tr("text019")}</span>
              <b className="text-foreground tabular-nums">{rupiah(dibayar)}</b>
            </li>
            <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-slate-100 pt-2">
              <span>{tr("text020")}</span>
              <b className="text-foreground tabular-nums">{rupiah(terbuka)}</b>
            </li>
            <li className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-t border-slate-100 pt-2">
              <span>{tr("text021")}</span>
              <span>{tr("text022")}</span>
            </li>
            <li className="border-t border-slate-100 pt-2">
               {tr("text023")} </li>
          </ul>
          <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
             {tr("text024")} </p>
        </CardPad>
      </Card>

      <Card className="mt-6">
        <CardPad>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
             {tr("text025")} </h2>
          <div className="mt-4">
            <CancelForm pendaftaranId={pid} />
          </div>
        </CardPad>
      </Card>

      <p className="mt-6 text-xs text-muted">
         {tr("text026")} {SITE.email} / {SITE.telepon}.
      </p>
    </div>
  );
}
