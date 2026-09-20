import { labelHari } from "@/lib/label";
import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import DaftarForm from "@/components/pendaftaran/daftar-form";

export const dynamic = "force-dynamic";

export default async function DaftarKelasPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
 const tr = await getTranslations("public");
 const locale = (await getLocale()) === "en" ? "en" : "id";
  const { id } = await params;
  const sp = await searchParams;
  const kelasId = Number(id);
  if (!Number.isInteger(kelasId)) notFound();

  const currentPath = `/classes/${kelasId}/daftar${sp.metode ? `?metode=${sp.metode}&tenor=${sp.tenor}` : ""}`;
  const session = await auth();
  if (!session?.user) return redirect({href: `/login?next=${encodeURIComponent(currentPath)}`, locale});
  if (session.user.role !== "orang_tua") return redirect({href: "/classes", locale});

  // Sambungan dari kartu skema bayar di halaman detail kelas.
  const metodeAwal = sp.metode === "dp_cicilan" ? "dp_cicilan" : "lunas";
  const tenorDipilih = Number(sp.tenor);

  const ortuId = Number(session.user.id);

  const [anak, targetList, allActiveClasses] = await Promise.all([
    collect(db.orm.public.Anak.where((a) => a.orangTuaId.eq(ortuId)).all()),
    collect(
      db.orm.public.Kelas.where((k) => k.id.eq(kelasId))
        .where((k) => k.status.eq("aktif"))
        .include("mataPelajaran", (b) => b.select("id", "nama", "deskripsi"))
        .include("guru", (b) => b.select("id", "name"))
        .include("periode", (b) => b.select("id", "nama", "status"))
        .include("jadwalItem", (b) => b.select("id", "hari", "jamMulai", "jamSelesai").orderBy((j) => j.hari.asc()))
        .all(),
    ),
    collect(
      db.orm.public.Kelas.where((k) => k.status.eq("aktif"))
        .include("mataPelajaran", (b) => b.select("id", "nama", "deskripsi"))
        .include("guru", (b) => b.select("id", "name"))
        .include("periode", (b) => b.select("id", "nama", "status"))
        .include("jadwalItem", (b) => b.select("id", "hari", "jamMulai", "jamSelesai").orderBy((j) => j.hari.asc()))
        .all(),
    ),
  ]);

  const target = targetList[0] ?? allActiveClasses.find((k) => k.id === kelasId);
  if (!target) notFound();

  const jadwal = (target.jadwalItem ?? [])
    .map((j) => `${labelHari(j.hari, locale)} ${String(j.jamMulai).slice(0, 5)}–${String(j.jamSelesai).slice(0, 5)}`)
    .join(", ");

  const pilihanKelasList = allActiveClasses.map((k) => ({
    id: k.id,
    jenjang: k.jenjang,
    tingkat: ((k as unknown as { tingkat?: string | null }).tingkat) ?? null,
    mapelNama: k.mataPelajaran.nama,
    guruNama: k.guru.name,
    jadwal: (k.jadwalItem ?? [])
      .map((j) => `${labelHari(j.hari, locale)} ${String(j.jamMulai).slice(0, 5)}–${String(j.jamSelesai).slice(0, 5)}`)
      .join(", ") || (locale === "en" ? "Schedule to follow" : "Jadwal menyusul"),
    biayaPeriode: Number(k.biayaPeriode),
    biayaDp: k.biayaDp == null ? null : Number(k.biayaDp),
    tenorMaksimum: k.tenorMaksimum,
    kuotaMaksimum: k.kuotaMaksimum,
    kuotaTerisi: k.kuotaTerisi,
  }));

  const targetTingkat = ((target as unknown as { tingkat?: string | null }).tingkat) ?? null;

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href={`/classes/${kelasId}`}
        className="text-sm font-semibold text-brand hover:text-brand-strong"
      >
        {tr("text270")}</Link>
      <h1 className="mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
        {tr("text271")}{target.mataPelajaran.nama}{targetTingkat ? ` · ${targetTingkat}` : ""}
      </h1>
      <p className="mt-1 text-sm text-muted">
        {target.guru.name} · {targetTingkat ? `${targetTingkat} · ` : ""}{target.jenjang} · {jadwal || tr("text274")} {tr("text275")}{" "}
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
      ) : (
        <Card className="mt-6">
          <CardPad>
            <DaftarForm
              kelasId={target.id}
              biayaPeriode={Number(target.biayaPeriode)}
              biayaDp={target.biayaDp == null ? null : Number(target.biayaDp)}
              tenorMaksimum={target.tenorMaksimum}
              metodeAwal={metodeAwal}
              tenorAwal={Number.isFinite(tenorDipilih) ? tenorDipilih : 2}
              anak={anak.map((a) => ({
                id: a.id,
                nama: a.nama,
                jenjangTerakhir: a.jenjangTerakhir ?? "",
              }))}
              kelasOptions={pilihanKelasList}
            />
          </CardPad>
        </Card>
      )}
    </div>
  );
}
