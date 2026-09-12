import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { Card, CardPad } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge, type StatusPendaftaran } from "@/components/status-badge";
import { rupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

const COLLECT = async <T,>(src: AsyncIterable<T>) => {
  const out: T[] = [];
  for await (const r of src) out.push(r);
  return out;
};

export default async function EnrollmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/home");
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isInteger(pid)) notFound();

  const ortuId = Number(session.user.id);

  // Pendaftaran harus milik anak milik orang tua ini.
  const [p] = await COLLECT(
    db.orm.public.Pendaftaran.where((x) => x.id.eq(pid)).all(),
  );
  if (!p) notFound();

  const [anak, kelas, tagihan, pengajuan] = await Promise.all([
  COLLECT(db.orm.public.Anak.where((a) => a.id.eq(p.anakId)).all()),
  COLLECT(db.orm.public.Kelas.where((k) => k.id.eq(p.kelasId)).all()),
  COLLECT(
  db.orm.public.Pembayaran.where((b) => b.pendaftaranId.eq(pid))
  .orderBy((b) => b.cicilanKe.asc())
  .all(),
  ),
  COLLECT(
  db.orm.public.PengajuanPembatalan.where((q) => q.pendaftaranId.eq(pid)).all(),
  ),
  ]);
  const a = anak[0];
  const k = kelas[0];
  const pengajuanMenunggu = pengajuan.find((q) => q.status === "menunggu");

  // Pastikan pendaftaran benar milik orang tua yang login.
  if (!a || a.orangTuaId !== ortuId) notFound();

  const status = p.status as StatusPendaftaran;
  const aktif = ["menunggu_pembayaran", "terdaftar", "tertunggak"].includes(status);
  const nextBill = tagihan.find((b) => b.status === "pending");
  const riwayat = tagihan.filter((b) => b.status !== "pending");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <p className="text-sm text-muted">
        <Link href="/home" className="underline">← Dashboard</Link>
      </p>
      <header className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Pendaftaran {a.nama} — Kelas #{p.kelasId}
          </h1>
          <p className="mt-1 text-sm text-muted">
            {k ? `${k.jenjang} · metode ${p.metodeBayar}` : ""} diajukan{" "}
            {new Date(p.createdAt).toLocaleDateString("id-ID")}
          </p>
        </div>
        <StatusBadge status={status} />
      </header>

      {status === "menunggu_pembayaran" ? (
        <Card className="mt-4">
          <CardPad>
            <p className="text-sm text-amber-800">
              Bayar dalam 24 jam sejak pengajuan, atau pendaftaran batal otomatis dan kuota dibuka kembali.
            </p>
          </CardPad>
        </Card>
      ) : null}
      {status === "tertunggak" ? (
        <Card className="mt-4">
          <CardPad>
            <p className="text-sm text-red-700">
              Ada tunggakan — segera lunasi tagihan untuk menghindari pembatalan pendaftaran.
            </p>
          </CardPad>
        </Card>
      ) : null}
      {status.startsWith("dibatalkan") ? (
        <Card className="mt-4">
          <CardPad>
            <p className="text-sm text-muted">
              Pendaftaran dibatalkan (
              {status === "dibatalkan_timeout"
                ? "otomatis — melewati batas bayar 24 jam"
                : status === "dibatalkan_tunggakan"
                  ? "karena tunggakan"
                  : status === "dibatalkan_orang_tua"
                    ? "atas permintaan orang tua"
                    : status.replaceAll("_", " ")}
              ).{status === "dibatalkan_orang_tua" ? " DP hangus untuk pembatalan atas permintaan orang tua." : ""}
            </p>
          </CardPad>
        </Card>
      ) : null}

      {/* Tagihan aktif — cuma SATU yang tampil (keputusan halaman detail). */}
      {nextBill && aktif ? (
        <Card className="mt-6 border-brand">
          <CardPad className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase text-muted">Tagihan aktif</p>
              <p className="mt-1 text-lg font-bold">
                {nextBill.tipe === "cicilan" ? `Cicilan ke-${nextBill.cicilanKe}` : nextBill.tipe}{" "}
                — {rupiah(Number(nextBill.jumlah))}
              </p>
              <p className="text-sm text-muted">
                Jatuh tempo {nextBill.jatuhTempo ? new Date(nextBill.jatuhTempo).toLocaleDateString("id-ID") : "-"}
              </p>
            </div>
            <ButtonLink href={`/enrollments/${p.id}/pay`}>Bayar Sekarang</ButtonLink>
          </CardPad>
        </Card>
      ) : null}

      {/* Riwayat tagihan */}
      {riwayat.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-sm font-bold uppercase text-muted">Riwayat tagihan</h2>
          <ul className="mt-3 grid gap-2">
            {riwayat.map((b) => (
              <li key={b.id}>
                <Card>
                  <CardPad className="flex items-center justify-between py-3">
                    <span className="text-sm">
                      {b.tipe === "cicilan" ? `Cicilan ke-${b.cicilanKe}` : b.tipe} —{" "}
                      {rupiah(Number(b.jumlah))}
                    </span>
                    <Badge tone={b.status === "berhasil" ? "emerald" : "red"}>
                      {b.status}
                    </Badge>
                  </CardPad>
                </Card>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {aktif && status === "terdaftar" && !pengajuanMenunggu ? (
      <p className="mt-8 text-sm">
      <Link href={`/enrollments/${p.id}/cancel`} className="underline">
      Ajukan pembatalan
      </Link>{" "}
      — DP hangus untuk pembatalan atas permintaan sendiri.
      </p>
      ) : null}
      {pengajuanMenunggu ? (
      <Card className="mt-8 border-amber-200 bg-amber-50">
      <CardPad className="py-3">
      <p className="text-sm text-amber-800">
      Pengajuan pembatalan kamu ({pengajuanMenunggu.kategori.replaceAll("_", " ")})
      masih menunggu keputusan admin. Diajukan{" "}
      {new Date(pengajuanMenunggu.createdAt).toLocaleDateString("id-ID")}.
      </p>
      </CardPad>
      </Card>
      ) : null}
    </div>
  );
}
