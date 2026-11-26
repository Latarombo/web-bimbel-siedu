import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Badge } from "@/components/ui/badge";
import { StudentGradeItemEditor } from "@/components/teacher/grades/student-grade-item-editor";

export const dynamic = "force-dynamic";

export default async function GradeInputPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const t = await getTranslations("teacher");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) return redirect({ href: "/login?next=/teacher/grades", locale });
  const { enrollmentId } = await params;

  const pid = Number(enrollmentId);
  if (!Number.isInteger(pid)) notFound();
  const guruId = Number(session.user.id);

  const [p] = await collect(
    db.orm.public.Pendaftaran.where((x) => x.id.eq(pid)).all(),
  );
  if (!p) notFound();

  const [kelas] = await collect(
    db.orm.public.Kelas.where((k) => k.id.eq(p.kelasId))
      .where((k) => k.guruId.eq(guruId))
      .all(),
  );
  if (!kelas) notFound();

  const [
    anak,
    presensi,
    hasilPenilaianRows,
    semuaPenilaian,
    riwayatPendaftaran,
    semuaKelas,
  ] = await Promise.all([
    collect(db.orm.public.Anak.where((a) => a.id.eq(p.anakId)).all()),
    collect(db.orm.public.Presensi.where((x) => x.pendaftaranId.eq(pid)).all()),
    collect(db.orm.public.HasilPenilaian.where((h) => h.pendaftaranId.eq(pid)).all()),
    collect(
      db.orm.public.Penilaian.where((pen) => pen.kelasId.eq(p.kelasId))
        .orderBy((pen) => pen.tanggal.desc())
        .all(),
    ),
    collect(db.orm.public.Pendaftaran.where((pnd) => pnd.anakId.eq(p.anakId)).all()),
    collect(db.orm.public.Kelas.all()),
  ]);

  const nama = anak[0]?.nama ?? t("childFallback", { id: p.anakId });
  const nHadir = presensi.filter((x) => x.status === "hadir").length;

  const kelasMap = new Map(semuaKelas.map((k) => [k.id, k]));
  const hasilByPenilaianId = new Map(hasilPenilaianRows.map((h) => [h.penilaianId, h]));

  // Kalkulasi rata-rata (hanya yang berstatus dinilai, dinormalisasi ke skala 100)
  const dinilaiRows = hasilPenilaianRows.filter(
    (h) => h.statusHasil === "dinilai" && h.nilai != null,
  );
  const penilaianMap = new Map(semuaPenilaian.map((pen) => [pen.id, pen]));
  const skor100List = dinilaiRows.map((h) => {
    const pen = penilaianMap.get(h.penilaianId);
    const maxScore = pen ? Number(pen.nilaiMaksimum) : 100;
    return (Number(h.nilai) / (maxScore > 0 ? maxScore : 100)) * 100;
  });
  const rataRata = skor100List.length
    ? Math.round(skor100List.reduce((s, v) => s + v, 0) / skor100List.length)
    : null;

  // Histori kelas terkait anak ini
  const kelasTerkait = riwayatPendaftaran.map((rp) => {
    const k = kelasMap.get(rp.kelasId);
    return {
      pendaftaranId: rp.id,
      namaKelas: k ? `${k.mapel || k.nama} · ${k.jenjang}` : `Kelas #${rp.kelasId}`,
      status: rp.status,
      isCurrent: rp.id === pid,
    };
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
      {/* Page Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
            {nama}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
            {t("gradeStudentDescription", {
              subject: kelas.mapel || kelas.nama || t("class"),
              level: kelas.jenjang,
              status: t(`status_${p.status}`),
            })}
          </p>
        </div>
      </div>

      {/* 3. Main Grid */}
      <div className="grid items-start gap-5 lg:grid-cols-[20rem_minmax(0,1fr)]">
        {/* KIRI: kartu siswa + info kehadiran + histori kelas terkait */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-6">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-2xs">
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-full bg-blue-100 dark:bg-blue-900/50 text-base font-bold text-blue-800 dark:text-blue-300">
                {nama.trim().charAt(0).toUpperCase()}
              </span>
              <div className="min-w-0">
                <p className="truncate font-display text-[15px] font-bold tracking-tight text-slate-900 dark:text-slate-100">{nama}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{t("enrollmentId", { id: p.id })}</p>
              </div>
            </div>
            <dl className="mt-4 space-y-3 border-t border-slate-100 dark:border-slate-800 pt-4 text-sm">
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">{t("recordedAttendance")}</dt>
                <dd className="font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {t("sessionsCount", { count: presensi.length })}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">{t("present")}</dt>
                <dd className="font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {t("sessionsCount", { count: nHadir })}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">Total Tugas Dinilai</dt>
                <dd className="font-bold tabular-nums text-slate-900 dark:text-slate-100">
                  {dinilaiRows.length} dari {semuaPenilaian.length}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3">
                <dt className="text-slate-500 dark:text-slate-400">Rata-rata Nilai</dt>
                <dd className="font-bold tabular-nums text-blue-600 dark:text-blue-400">
                  {rataRata != null ? rataRata : "-"}
                </dd>
              </div>
            </dl>
          </div>

          {/* Histori Kelas Terkait */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
            <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-3 sm:px-6">
              <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100">Histori Kelas Terkait</h3>
            </div>
            <div className="p-4 sm:p-6">
              {kelasTerkait.length === 0 ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">Tidak ada kelas lain.</p>
              ) : (
                <ul className="space-y-2 text-xs">
                  {kelasTerkait.map((kt) => (
                    <li
                      key={kt.pendaftaranId}
                      className={`flex items-center justify-between rounded-lg px-3 py-2 ${
                        kt.isCurrent
                          ? "bg-blue-50 dark:bg-blue-950/40 font-semibold text-blue-900 dark:text-blue-300"
                          : "text-slate-600 dark:text-slate-400"
                      }`}
                    >
                      <span className="truncate">{kt.namaKelas}</span>
                      <Badge tone={kt.status === "terdaftar" ? "emerald" : "slate"}>
                        {t(`status_${kt.status}`)}
                      </Badge>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

        {/* KANAN: Daftar Tugas & Penilaian Terpadu */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-2xs">
            <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-4 sm:px-6 flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-950 dark:text-slate-100">
                  Riwayat Tugas & Penilaian Kelas
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Seluruh asesmen kelas yang diikuti siswa ini. Guru dapat langsung memperbarui nilai dan catatan kapan saja.
                </p>
              </div>
              <Link
                href={`/teacher/classes/${kelas.id}?tab=asesmen`}
                className="shrink-0 inline-flex items-center rounded-lg bg-blue-600 hover:bg-blue-700 px-3 py-2 text-xs font-semibold text-white transition-colors"
              >
                + Buat Tugas Baru
              </Link>
            </div>

            {semuaPenilaian.length === 0 ? (
              <div className="px-4 py-14 text-center sm:px-6">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                  Belum ada tugas atau penilaian yang dibuat di kelas ini.
                </p>
                <div className="mt-3">
                  <Link
                    href={`/teacher/classes/${kelas.id}?tab=asesmen`}
                    className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Mulai Buat Tugas Pertama →
                  </Link>
                </div>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {semuaPenilaian.map((pen) => {
                  const h = hasilByPenilaianId.get(pen.id);
                  const statusHasil = h?.statusHasil ?? "belum_dinilai";
                  const nilaiVal = h?.nilai != null ? String(h.nilai) : "";
                  const catatanVal = h?.catatan ?? "";
                  const maxScore = Number(pen.nilaiMaksimum) || 100;

                  return (
                    <li key={pen.id} className="p-4 sm:p-6 space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            {pen.nama}
                          </p>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-2">
                            <span>
                              {new Date(`${pen.tanggal}T00:00:00+07:00`).toLocaleDateString(
                                locale === "en" ? "en-GB" : "id-ID",
                                { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Jakarta" },
                              )}
                            </span>
                            {pen.draf ? (
                              <>
                                <span>•</span>
                                <span className="font-semibold text-amber-600 dark:text-amber-400">Draf</span>
                              </>
                            ) : null}
                          </p>
                          {catatanVal ? (
                            <p className="mt-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 p-3 text-xs text-slate-700 dark:text-slate-300 leading-relaxed border border-slate-100 dark:border-slate-800">
                              <span className="font-semibold text-slate-600 dark:text-slate-400 mr-1">Catatan:</span>
                              {catatanVal}
                            </p>
                          ) : null}
                        </div>

                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-bold tabular-nums ${
                              statusHasil === "dinilai"
                                ? "bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                : statusHasil === "tidak_ikut"
                                  ? "bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                                  : "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700"
                            }`}
                          >
                            {statusHasil === "dinilai"
                              ? nilaiVal
                              : statusHasil === "tidak_ikut"
                                ? "Tidak Ikut"
                                : "Belum Dinilai"}
                          </span>
                        </div>
                      </div>

                      {/* Inline Quick Editor */}
                      <div className="pt-1">
                        <StudentGradeItemEditor
                          kelasId={kelas.id}
                          pendaftaranId={pid}
                          penilaianId={pen.id}
                          penilaianNama={pen.nama}
                          nilaiMaksimum={maxScore}
                          initialStatus={statusHasil}
                          initialNilai={nilaiVal}
                          initialCatatan={catatanVal}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
