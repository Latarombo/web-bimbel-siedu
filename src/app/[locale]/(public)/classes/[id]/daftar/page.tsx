import { labelHari } from "@/lib/label";
import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { kelasTersediaUntukJenjang, type Jenjang } from "@/lib/services/pendaftaran";
import { rupiah } from "@/lib/format";
import DaftarForm from "@/components/pendaftaran/daftar-form";

export const dynamic = "force-dynamic";

const AKTIF = ["menunggu_pembayaran", "terdaftar", "tertunggak"] as const;

function barisLabel(label: string, nilai: string) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-right text-sm font-semibold text-foreground">{nilai}</span>
    </div>
  );
}

export default async function DaftarKelasPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
 const tr = await getTranslations("public");
 const locale = (await getLocale()) === "en" ? "en" : "id";
  const session = await auth();
  if (!session?.user) return redirect({href: "/login?next=/classes", locale});
  if (session.user.role !== "orang_tua") return redirect({href: "/classes", locale});
  const { id } = await params;
  const sp = await searchParams;
  // Sambungan dari kartu skema bayar di halaman detail kelas.
  const metodeAwal = sp.metode === "dp_cicilan" ? "dp_cicilan" : "lunas";
  const tenorDipilih = Number(sp.tenor);
  const kelasId = Number(id);
  if (!Number.isInteger(kelasId)) notFound();

  const ortuId = Number(session.user.id);

  const anak = await collect(
    db.orm.public.Anak.where((a) => a.orangTuaId.eq(ortuId)).all(),
  );

  // Ringkasan kelas diambil dari daftar kelas tersedia per jenjang ANAK —
  // bug lama memakai jenjang anak[0] untuk kelas target dan merem default
  // "SD" saat jenjang anak belum terisi, jadi orang tua dengan anak TK/SMP/SMA
  // dikira tidak punya kelas (notFound) padahal kelasnya ada.
  const jenjangAnak = [...new Set(anak.map((a) => a.jenjangTerakhir).filter(Boolean))] as Jenjang[];
  const pool = await Promise.all(
    jenjangAnak.map((j) => kelasTersediaUntukJenjang(j)),
  );
  const target = pool.flat().find((k) => k.id === kelasId);
  if (!target) notFound();

  const jadwal = (target.jadwalItem ?? [])
    .map((j) => `${labelHari(j.hari, locale)} ${String(j.jamMulai).slice(0, 5)}–${String(j.jamSelesai).slice(0, 5)}`)
    .join(", ");

  // Anak yang boleh mendaftar ke kelas ini saja (BR#13: jenjang harus sama).
  const kandidat = anak.filter(
    (a) => a.jenjangTerakhir && a.jenjangTerakhir === target.jenjang,
  );
  // Kunci BR#29: anak sudah punya pendaftaran aktif di kelas ini → jangan
  // tawarkan lagi (dulu muncul di dropdown lalu ditolak server saat submit).
  const pendaftaranAktif = kandidat.length
    ? await collect(
        db.orm.public.Pendaftaran.where((p) => p.kelasId.eq(kelasId))
          .where((p) => p.status.in([...AKTIF]))
          .all(),
      )
    : [];
  const sudahDaftar = new Set(pendaftaranAktif.map((p) => p.anakId));
  const bisaDaftar = kandidat.filter((a) => !sudahDaftar.has(a.id));

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href={`/classes/${kelasId}`}
        className="text-sm font-semibold text-brand hover:text-brand-strong"
      >
        {tr("text270")}</Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
        {tr("text271")}{target.mataPelajaran.nama}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {target.guru.name} · {target.jenjang} · {jadwal || tr("text274")} {tr("text275")}{" "}
        {target.kuotaMaksimum - target.kuotaTerisi}
      </p>

      {anak.length === 0 ? (
        <Card className="mt-6">
          <CardPad className="text-center">
            <p className="text-sm text-muted">
              {tr("text277")}</p>
            <ButtonLink href="/children/new" className="mt-4">
              {tr("text278")}</ButtonLink>
          </CardPad>
        </Card>
      ) : bisaDaftar.length === 0 ? (
        <Card className="mt-6">
          <CardPad className="text-center">
            <p className="text-sm text-muted">
              {kandidat.length > 0
                ? tr("text279")
                : tr("noChildLevel", {level: target.jenjang})}
            </p>
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3">
              <ButtonLink href="/children/new" variant="outline">
                {tr("text280")}</ButtonLink>
              <ButtonLink href={`/classes/${kelasId}`}>{tr("text281")}</ButtonLink>
            </div>
          </CardPad>
        </Card>
      ) : (
        <>
          {/* Ringkasan pesanan — harga terlihat sebelum submit, bukan tersembunyi */}
          <Card className="mt-6">
            <CardPad>
              <div className="mb-4 flex flex-wrap gap-2">
                <Badge tone="brand">{target.mataPelajaran.nama}</Badge>
                <Badge>{target.jenjang}</Badge>
                <Badge tone="emerald">{target.periode.nama}</Badge>
              </div>
              <div className="divide-y divide-slate-100">
                {barisLabel(tr("text282"), target.guru.name)}
                {barisLabel(tr("text283"), jadwal || tr("text284"))}
                {barisLabel(
                  tr("text285"),
                  tr("availableOf", {available: target.kuotaMaksimum - target.kuotaTerisi, total: target.kuotaMaksimum}),
                )}
                {barisLabel(tr("text286"), rupiah(Number(target.biayaPeriode)))}
              </div>
            </CardPad>
          </Card>

          <Card className="mt-4">
            <CardPad>
              <DaftarForm
                kelasId={target.id}
                biayaPeriode={Number(target.biayaPeriode)}
                biayaDp={target.biayaDp == null ? null : Number(target.biayaDp)}
                tenorMaksimum={target.tenorMaksimum}
                metodeAwal={metodeAwal}
                tenorAwal={Number.isFinite(tenorDipilih) ? tenorDipilih : 2}
                anak={bisaDaftar.map((a) => ({
                  id: a.id,
                  nama: a.nama,
                  jenjangTerakhir: a.jenjangTerakhir ?? "",
                }))}
              />
            </CardPad>
          </Card>
        </>
      )}
    </div>
  );
}
