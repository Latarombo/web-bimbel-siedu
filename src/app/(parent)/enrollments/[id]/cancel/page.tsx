import { notFound, redirect } from "next/navigation";
import Link from "next/link";
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
  const session = await auth();
  if (!session?.user) redirect("/login?next=/home");
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
  if (!AKTIF.includes(p.status)) redirect(`/enrollments/${pid}`);

  // Pengajuan menunggu sudah ada → redirect ke detail yang memasang banner.
  const pengajuan = await collect(
    db.orm.public.PengajuanPembatalan.where((x) =>
      x.pendaftaranId.eq(pid),
    ).all(),
  );
  if (pengajuan.some((x) => x.status === "menunggu"))
    redirect(`/enrollments/${pid}`);

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
    <div className="mx-auto max-w-xl px-4 py-10">
      <p className="text-sm text-muted">
        <Link href={`/enrollments/${pid}`} className="underline">
          ← Kembali ke detail
        </Link>
      </p>
      <header className="mt-3">
        <h1 className="text-2xl font-bold tracking-tight">Ajukan pembatalan</h1>
        <p className="mt-1 text-sm text-muted">
          {a[0].nama} · {mapel ?? `Kelas #${p.kelasId}`} ·{" "}
          <Badge tone="slate">{p.status.replaceAll("_", " ")}</Badge>
        </p>
      </header>

      <Card className="mt-6">
        <CardPad>
          <p className="text-sm font-semibold">
            Yang terjadi kalau pengajuan disetujui
          </p>
          <ul className="mt-3 grid gap-2 text-sm text-muted">
            <li className="flex justify-between gap-4 border-t border-slate-100 pt-2">
              <span>Sudah dibayar</span>
              <b className="text-foreground tabular-nums">{rupiah(dibayar)}</b>
            </li>
            <li className="flex justify-between gap-4 border-t border-slate-100 pt-2">
              <span>Tagihan terbuka (batal ditagih)</span>
              <b className="text-foreground tabular-nums">{rupiah(terbuka)}</b>
            </li>
            <li className="flex justify-between gap-4 border-t border-slate-100 pt-2">
              <span>Kuota kelas</span>
              <span>dibuka untuk anak lain</span>
            </li>
            <li className="border-t border-slate-100 pt-2">
              Presensi &amp; nilai anak tetap tersimpan di riwayat akun.
            </li>
          </ul>
          <p className="mt-4 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-800">
            Refund tidak otomatis. Uang kembali penuh hanya untuk 4 kasus:
            kesalahan sistem, salah nominal, salah rekening, atau salah pilih
            kelas yang terbukti (BR#19). Lainnya = DP hangus. Admin menilai
            berdasarkan penjelasanmu.
          </p>
        </CardPad>
      </Card>

      <Card className="mt-6">
        <CardPad>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">
            Formulir pengajuan
          </h2>
          <div className="mt-4">
            <CancelForm pendaftaranId={pid} />
          </div>
        </CardPad>
      </Card>

      <p className="mt-6 text-xs text-muted">
        Butuh bantuan? Hubungi {SITE.email} / {SITE.telepon}.
      </p>
    </div>
  );
}
