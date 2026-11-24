import { getLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { getRaporKelas } from "@/lib/rapor";
import { ArrowLeft, ExternalLink } from "lucide-react";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TeacherClassReportsPage({
  params,
}: {
  params: Promise<{ classId: string }>;
}) {
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) return redirect("/login?next=/teacher/classes");

  const { classId } = await params;
  const kid = Number(classId);
  if (!Number.isInteger(kid)) notFound();
  const guruId = Number(session.user.id);

  const raporData = await getRaporKelas(kid, guruId);
  if (!raporData) notFound();

  const totalSiswa = raporData.students.length;
  const totalDiterbitkan = raporData.students.filter(
    (s) => s.statusRapor === "diterbitkan",
  ).length;

  const validAverages = raporData.students
    .map((s) => s.rataRataNilai)
    .filter((v): v is number => v !== null);
  const rataRataKelas =
    validAverages.length > 0
      ? Math.round(validAverages.reduce((a, b) => a + b, 0) / validAverages.length)
      : null;

  const validKehadiran = raporData.students.map((s) => s.persenKehadiran);
  const rataKehadiranKelas =
    validKehadiran.length > 0
      ? Math.round(validKehadiran.reduce((a, b) => a + b, 0) / validKehadiran.length)
      : 100;

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
      {/* Top Header */}
      <div>
        <Link
          href={`/teacher/classes/${kid}`}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 transition-colors"
        >
          <ArrowLeft className="size-4" />
          <span>Kembali ke Detail Kelas</span>
        </Link>
        <div className="mt-2 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
              Rapor Semester: {raporData.namaMapel}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400">
              {raporData.jenjang} {raporData.tingkat ? `· ${raporData.tingkat}` : ""} · Periode: {raporData.namaPeriode}
            </p>
          </div>
        </div>
      </div>

      {/* KPI Cards (KPIs are type, not tiles per CONSTRAINTS.md) */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Total Siswa
          </span>
          <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-slate-50 tabular-nums">
            {totalSiswa}
          </p>
          <span className="mt-1 block text-2xs text-slate-500">Terdaftar di kelas</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Rapor Diterbitkan
          </span>
          <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-slate-50 tabular-nums">
            {totalDiterbitkan}/{totalSiswa}
          </p>
          <span className="mt-1 block text-2xs text-slate-500">Telah sampai ke ortu</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Rata-rata Nilai
          </span>
          <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-slate-50 tabular-nums">
            {rataRataKelas != null ? rataRataKelas : "—"}
          </p>
          <span className="mt-1 block text-2xs text-slate-500">Skala 100 akumulasi</span>
        </div>

        <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-2xs">
          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
            Rata-rata Presensi
          </span>
          <p className="mt-1 text-2xl font-bold text-slate-950 dark:text-slate-50 tabular-nums">
            {rataKehadiranKelas}%
          </p>
          <span className="mt-1 block text-2xs text-slate-500">Kehadiran seluruh sesi</span>
        </div>
      </div>

      {/* Roster Rapor Table */}
      <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xs overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800">
          <h2 className="text-sm font-semibold text-slate-950 dark:text-slate-50">
            Daftar Evaluasi Rapor Siswa
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Buka rapor tiap siswa untuk memeriksa perhitungan otomatis dan memberikan catatan nilai subjektif.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 text-center w-12">#</th>
                <th className="py-3 px-4 text-left">Nama Siswa</th>
                <th className="py-3 px-4 text-right">Kehadiran</th>
                <th className="py-3 px-4 text-right">Tugas Dinilai</th>
                <th className="py-3 px-4 text-right">Rata-rata Nilai</th>
                <th className="py-3 px-4 text-center">Status Rapor</th>
                <th className="py-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {raporData.students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    Tidak ada siswa terdaftar pada kelas ini.
                  </td>
                </tr>
              ) : (
                raporData.students.map((s, idx) => (
                  <tr key={s.pendaftaranId} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-center text-slate-500 tabular-nums">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-900 dark:text-slate-100">
                      {s.nama}
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums">
                      <span className="font-medium text-slate-900 dark:text-slate-100">
                        {s.hadir}/{s.totalSesi}
                      </span>{" "}
                      <span className="text-slate-500">({s.persenKehadiran}%)</span>
                    </td>
                    <td className="py-3 px-4 text-right tabular-nums text-slate-700 dark:text-slate-300">
                      {s.totalTugasDinilai} tugas
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900 dark:text-slate-100 tabular-nums text-sm">
                      {s.rataRataNilai != null ? s.rataRataNilai : "—"}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {s.statusRapor === "diterbitkan" ? (
                        <span className="inline-flex items-center gap-1.5 rounded bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2 py-0.5 text-2xs font-semibold text-emerald-700 dark:text-emerald-300">
                          <span className="size-1.5 rounded-full bg-emerald-500" />
                          Diterbitkan
                        </span>
                      ) : s.statusRapor === "draf" ? (
                        <span className="inline-flex items-center gap-1.5 rounded bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 px-2 py-0.5 text-2xs font-semibold text-amber-700 dark:text-amber-300">
                          <span className="size-1.5 rounded-full bg-amber-500" />
                          Draf Catatan
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 rounded bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-2 py-0.5 text-2xs font-medium text-slate-600 dark:text-slate-400">
                          Belum Diisi
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link
                        href={`/teacher/classes/${kid}/reports/${s.pendaftaranId}`}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 px-3 py-1.5 text-xs font-semibold text-slate-800 dark:text-slate-200 shadow-2xs transition-colors"
                      >
                        <span>{s.statusRapor === "belum_diisi" ? "Isi Rapor" : "Buka Rapor"}</span>
                        <ExternalLink className="size-3 text-slate-400" />
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
