import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { Card, CardPad } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge, type StatusPendaftaran } from "@/components/status-badge";
import { Clock } from "lucide-react";
import { rupiah, fmtTanggal } from "@/lib/format";
import { getLabelMaps } from "@/lib/label";
import { sisaWaktu24Jam } from "@/lib/hari";
import { ClassTicket } from "@/components/parent/class-ticket";

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
  const tr = await getTranslations("parent");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) {
    return redirect({ href: "/login?next=/home", locale });
  }
  const { id } = await params;
  const pid = Number(id);
  if (!Number.isInteger(pid)) notFound();

  const ortuId = Number(session.user.id);

  // Pendaftaran harus milik anak milik orang tua ini.
  const [p] = await COLLECT(
    db.orm.public.Pendaftaran.where((x) => x.id.eq(pid)).all(),
  );
  if (!p) notFound();

  const [anak, kelas, tagihan, pengajuan, jadwal] = await Promise.all([
    COLLECT(db.orm.public.Anak.where((a) => a.id.eq(p.anakId)).all()),
    COLLECT(db.orm.public.Kelas.where((k) => k.id.eq(p.kelasId)).all()),
    COLLECT(
      db.orm.public.Pembayaran.where((b) => b.pendaftaranId.eq(pid))
        .orderBy((b) => b.cicilanKe.asc())
        .all(),
    ),
    COLLECT(
      db.orm.public.PengajuanPembatalan.where((q) => q.pendaftaranId.eq(pid))
        .all(),
    ),
    COLLECT(
      db.orm.public.JadwalItem.where((j) => j.kelasId.eq(p.kelasId)).all(),
    ),
  ]);
  const a = anak[0];
  const k = kelas[0];
  const pengajuanMenunggu = pengajuan.find((q) => q.status === "menunggu");

  // Pastikan pendaftaran benar milik orang tua yang login.
  if (!a || a.orangTuaId !== ortuId) notFound();

  const [mapel, guru] = k
    ? await Promise.all([
        COLLECT(db.orm.public.MataPelajaran.where((m) => m.id.eq(k.mataPelajaranId)).all()),
        COLLECT(db.orm.public.User.where((u) => u.id.eq(k.guruId)).all()),
      ])
    : [[], []];
  const mapelNama = mapel[0]?.nama ?? `Kelas #${p.kelasId}`;
  const guruNama = guru[0]?.name ?? "Pengajar Siedu";

  const status = p.status as StatusPendaftaran;
  const aktif = ["menunggu_pembayaran", "terdaftar", "tertunggak"].includes(status);
  const nextBill = tagihan.find((b) => b.status === "pending");
  const riwayat = tagihan.filter((b) => b.status !== "pending");

  // Perhitungan sisa waktu batas bayar 24 jam (server-side)
  const { isExpired, sisaJam, sisaMenit } = sisaWaktu24Jam(p.createdAt);

  const sisaWaktuTeks = isExpired
    ? tr("timeExpired")
    : sisaJam > 0
      ? tr("timeRemaining", { hours: sisaJam, minutes: sisaMenit })
      : tr("timeRemainingMinutesOnly", { minutes: sisaMenit });

  const metodeBayarTeks =
    p.metodeBayar === "dp_cicilan"
      ? p.tenorBulan
        ? tr("paymentMethodInstallment", { tenor: p.tenorBulan })
        : tr("paymentMethodInstallmentNoTenor")
      : tr("paymentMethodFull");

  const tagihanAwalNominal = nextBill ? Number(nextBill.jumlah) : 0;
  const tagihanAwalLabel =
    nextBill?.tipe === "dp"
      ? tr("text045")
      : nextBill?.tipe === "lunas"
        ? tr("text046")
        : tr("paymentSummaryAmount");

  const tanggal = (v: string | Date | null | undefined) =>
    v ? fmtTanggal(typeof v === "string" ? v : v.toISOString(), locale) : "-";

  const labelTagihan = (b: { tipe: string; cicilanKe: number | null }) =>
    b.tipe === "cicilan"
      ? tr("enrollInstallment", { number: b.cicilanKe ?? 0 })
      : b.tipe === "dp"
        ? tr("text045")
        : tr("text046");

  const alasanBatal =
    status === "dibatalkan_timeout"
      ? tr("text034")
      : status === "dibatalkan_tunggakan"
        ? tr("text035")
        : status === "dibatalkan_orang_tua"
          ? tr("text036")
          : status === "dibatalkan_kelas"
            ? tr("enrollCancelledClass")
            : `${tr("text028")} ${status.replaceAll("_", " ")}.`;

  const kategoriPengajuan =
    getLabelMaps(locale).LABEL_KATEGORI_BATAL[pengajuanMenunggu?.kategori ?? ""] ??
    (pengajuanMenunggu?.kategori ?? "").replaceAll("_", " ");

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <p className="text-sm">
        <Link href="/home" className="text-muted underline underline-offset-4 hover:text-foreground">
          {tr("text027")}
        </Link>
      </p>

      <header className="mt-3 flex flex-wrap items-start justify-between gap-x-4 gap-y-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">
            {tr("text028")} {mapelNama}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {a.nama}
            {k ? ` · ${k.jenjang}` : ""}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {tr("enrollSubmitted", { date: tanggal(p.createdAt) })}
          </p>
        </div>
        <StatusBadge status={status} />
      </header>

      {/* Menunggu pembayaran: panel utama dengan hitung mundur 24 jam */}
      {status === "menunggu_pembayaran" ? (
        <section className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 sm:p-6">
          <h2 className="text-lg font-semibold tracking-tight text-amber-950 sm:text-xl">
            {tr("pendingPaymentTitle")}
          </h2>
          <p className="mt-1.5 max-w-prose text-sm leading-relaxed text-amber-900/80">
            {tr("pendingPaymentNotice")}
          </p>
          <p
            className={`mt-3 flex items-center gap-1.5 text-sm font-semibold tabular-nums ${
              isExpired ? "text-rose-700" : "text-amber-900"
            }`}
          >
            <Clock className="size-4 shrink-0" aria-hidden="true" />
            <span>{sisaWaktuTeks}</span>
          </p>

          <dl className="mt-5 grid gap-x-6 gap-y-4 border-t border-amber-200 pt-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-medium text-amber-800/80">{tr("paymentSummaryStudent")}</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-900">{a.nama}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-amber-800/80">{tr("paymentSummaryClass")}</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-900">
                {mapelNama}
                {k ? ` · ${k.jenjang}` : ""}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-amber-800/80">{tr("paymentSummaryMethod")}</dt>
              <dd className="mt-0.5 text-sm font-semibold text-slate-900">{metodeBayarTeks}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-amber-900">{tagihanAwalLabel}</dt>
              <dd className="mt-0.5 text-lg font-bold tabular-nums text-amber-950 sm:text-xl">
                {rupiah(tagihanAwalNominal)}
              </dd>
            </div>
          </dl>

          <div className="mt-5 flex flex-col gap-3 border-t border-amber-200 pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="max-w-md text-xs leading-relaxed text-amber-900/75">
              {tr("payInstructionHint")}
            </p>
            <ButtonLink
              href={`/enrollments/${p.id}/pay`}
              size="lg"
              className="min-h-11 px-6 shrink-0"
            >
              {tr("payNowButton")}
            </ButtonLink>
          </div>
        </section>
      ) : null}

      {/* Tiket masuk & panduan ruang belajar (saat sudah terdaftar) */}
      {status === "terdaftar" && k ? (
        <div className="mt-6">
          <ClassTicket
            enrollmentId={p.id}
            childName={a.nama}
            subjectName={mapelNama}
            grade={k.jenjang}
            teacherName={guruNama}
            ruangan={k.ruangan}
            jadwal={jadwal.map((j) => ({
              hari: j.hari,
              mulai: j.jamMulai,
              selesai: j.jamSelesai,
            }))}
          />
        </div>
      ) : null}

      {status === "tertunggak" ? (
        <p className="mt-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm leading-relaxed text-rose-800">
          {tr("text032")}
        </p>
      ) : null}

      {status.startsWith("dibatalkan") ? (
        <p className="mt-6 rounded-xl border border-slate-200 bg-surface p-5 text-sm leading-relaxed text-muted shadow-sm">
          {alasanBatal}
        </p>
      ) : null}

      {/* Tagihan terbuka: cicilan berikutnya atau pelunasan yang belum dibayar */}
      {nextBill && aktif && status !== "menunggu_pembayaran" ? (
        <section className="mt-8">
          <h2 className="text-base font-semibold text-foreground">{tr("text038")}</h2>
          <Card className="mt-3">
            <CardPad className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="text-base font-semibold text-foreground">{labelTagihan(nextBill)}</p>
                <p className="mt-1 text-sm text-muted">
                  {nextBill.jatuhTempo
                    ? `${tr("text039")}: ${tanggal(nextBill.jatuhTempo)}`
                    : tr("text049")}
                </p>
                <p className="mt-0.5 text-xs text-muted">{metodeBayarTeks}</p>
              </div>
              <div className="flex shrink-0 items-center gap-4">
                <span className="text-lg font-bold tabular-nums text-foreground">
                  {rupiah(Number(nextBill.jumlah))}
                </span>
                <ButtonLink href={`/enrollments/${p.id}/pay`} size="lg" className="min-h-11 px-5">
                  {tr("text040")}
                </ButtonLink>
              </div>
            </CardPad>
          </Card>
        </section>
      ) : null}

      {/* Riwayat tagihan */}
      {riwayat.length > 0 ? (
        <section className="mt-8">
          <h2 className="text-base font-semibold text-foreground">{tr("text041")}</h2>
          <Card className="mt-3 overflow-hidden">
            <ul className="divide-y divide-slate-100">
              {riwayat.map((b) => (
                <li
                  key={b.id}
                  className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 px-5 py-4 sm:px-6"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{labelTagihan(b)}</p>
                    <p className="mt-0.5 text-xs text-muted">
                      {b.dibayarPada
                        ? tr("enrollPaidOn", { date: tanggal(b.dibayarPada) })
                        : b.jatuhTempo
                          ? `${tr("text039")}: ${tanggal(b.jatuhTempo)}`
                          : tr("text049")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold tabular-nums text-foreground">
                      {rupiah(Number(b.jumlah))}
                    </span>
                    <Badge tone={b.status === "berhasil" ? "emerald" : "red"}>
                      {b.status === "berhasil" ? tr("text148") : tr("text150")}
                    </Badge>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </section>
      ) : null}

      {/* Pembatalan */}
      {aktif && status === "terdaftar" && !pengajuanMenunggu ? (
        <div className="mt-8 border-t border-slate-200 pt-6">
          <Link
            href={`/enrollments/${p.id}/cancel`}
            className="text-sm text-foreground underline underline-offset-4 hover:text-brand"
          >
            {tr("text017")}
          </Link>
          <p className="mt-1 text-xs text-muted">{tr("text042")}</p>
        </div>
      ) : null}

      {pengajuanMenunggu ? (
        <p className="mt-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-900">
          {tr("enrollCancelPending", {
            kategori: kategoriPengajuan,
            date: tanggal(pengajuanMenunggu.createdAt),
          })}
        </p>
      ) : null}
    </div>
  );
}
