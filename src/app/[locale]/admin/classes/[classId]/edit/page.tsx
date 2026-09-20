import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { redirect, getPathname } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Badge } from "@/components/ui/badge";
import { PageShell, PageHeader, Panel } from "@/components/admin/ui";
import KelasForm from "@/components/admin/kelas-form";

export const dynamic = "force-dynamic";

export default async function AdminClassesEdit({ params }: { params: Promise<{ classId: string }> }) {
  const locale = await getLocale();
  const t = await getTranslations("admin");
  const labelKelas = (value: string) => t.has(`labelKelas_${value}`) ? t(`labelKelas_${value}`) : value.replaceAll("_", " ");
  const session = await auth();
  if (!session?.user) return redirect({ href: { pathname: "/login", query: { next: getPathname({ href: "/admin/classes", locale }) } }, locale });
  const { classId } = await params;
  const kelasId = Number(classId);
  if (!Number.isInteger(kelasId)) notFound();

  const [kelasSemua, mapel, guru, periode, jadwal, pendaftaran] = await Promise.all([
    collect(db.orm.public.Kelas.where((k) => k.id.eq(kelasId)).all()),
    collect(db.orm.public.MataPelajaran.all()),
    collect(db.orm.public.User.where((u) => u.role.eq("guru")).all()),
    collect(db.orm.public.PeriodePendaftaran.all()),
    collect(db.orm.public.JadwalItem.where((j) => j.kelasId.eq(kelasId)).all()),
    collect(db.orm.public.Pendaftaran.all()),
  ]);
  const kelas = kelasSemua[0];
  if (!kelas) notFound();
  const mapelNama = mapel.find((m) => m.id === kelas.mataPelajaranId)?.nama ?? t("text11");
  const terisi = pendaftaran.filter(
    (p) => p.kelasId === kelas.id && ["terdaftar", "tertunggak", "menunggu_pembayaran"].includes(p.status),
  ).length;

  return (
    <PageShell>
      <PageHeader
        title={t("editName", { name: mapelNama })}
        desc={t("text77")}
        meta={t("seatsFilled", { filled: terisi, total: kelas.kuotaMaksimum })}
      />

      <div className="mt-3 flex items-center gap-2">
        <Badge tone={kelas.status === "aktif" ? "emerald" : "slate"}>{labelKelas(kelas.status)}</Badge>
        <span className="text-xs text-slate-500">{t("classLevelDetail", { level: kelas.jenjang, id: kelas.id })}</span>
      </div>

      <Panel className="mt-5 p-6 sm:p-8">
        <KelasForm
          kelasId={kelas.id}
          mapelOptions={mapel.map((m) => ({ id: m.id, nama: m.nama }))}
          guruOptions={guru.map((g) => ({ id: g.id, nama: g.name })).sort((a, b) => a.nama.localeCompare(b.nama))}
          periodeOptions={periode.map((p) => ({ id: p.id, nama: p.nama, status: p.status }))}
          defaults={{
            mataPelajaranId: kelas.mataPelajaranId,
            guruId: kelas.guruId,
            periodeId: kelas.periodeId,
            jenjang: kelas.jenjang,
            tingkat: ((kelas as unknown as { tingkat?: string | null }).tingkat) ?? "",
            kuotaMaksimum: kelas.kuotaMaksimum,
            kuotaMinimum: kelas.kuotaMinimum,
            biayaPeriode: String(kelas.biayaPeriode),
            biayaDp: kelas.biayaDp ? String(kelas.biayaDp) : "",
            tenorMaksimum: kelas.tenorMaksimum ? String(kelas.tenorMaksimum) : "",
            status: kelas.status,
          }}
          defaultJadwal={jadwal
            .sort((a, b) => a.hari.localeCompare(b.hari) || a.jamMulai.localeCompare(b.jamMulai))
            .map((j) => ({ hari: j.hari, jamMulai: j.jamMulai.slice(0, 5), jamSelesai: j.jamSelesai.slice(0, 5) }))}
        />
      </Panel>

      <p className="mt-4 text-sm text-slate-500">
        <Link href="/admin/classes" className="font-semibold text-blue-700 hover:underline">{t("text75")} </Link>
      </p>
    </PageShell>
  );
}
