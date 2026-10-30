import { getTranslations, getLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { notFound } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { hariDariTanggal, dalamJendela7Hari, tanggalValid } from "@/lib/hari";
import { ArrowLeft } from "lucide-react";
import { SessionStatStrip, TeacherAttendanceManager } from "@/components/teacher/attendance";

export const dynamic = "force-dynamic";

const STATUS_WARN = new Set(["izin", "sakit", "alpa"]);

export default async function AttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ classId: string; date: string }>;
  searchParams: Promise<{ sesi?: string }>;
}) {
  const t = await getTranslations("teacher");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) return redirect({ href: "/login?next=/teacher/classes", locale });
  const { classId, date } = await params;
  const { sesi: sesiParam } = await searchParams;
  const kid = Number(classId);
  if (!Number.isInteger(kid) || kid <= 0 || !tanggalValid(date)) notFound();
  const guruId = Number(session.user.id);

  const [kelas] = await collect(
    db.orm.public.Kelas.where((k) => k.id.eq(kid))
      .where((k) => k.guruId.eq(guruId))
      .all(),
  );
  if (!kelas || kelas.status === "dibatalkan") notFound();
  const [periode] = await collect(
    db.orm.public.PeriodePendaftaran.where((p) => p.id.eq(kelas.periodeId)).all(),
  );
  if (!periode || date < periode.tanggalMulai || date > periode.tanggalSelesai) notFound();

  const jadwal = await collect(
    db.orm.public.JadwalItem.where((j) => j.kelasId.eq(kid)).all(),
  );
  const hari = hariDariTanggal(date);
  const tanggal = date;

  const mapel = await collect(db.orm.public.MataPelajaran.where((m) => m.id.eq(kelas.mataPelajaranId)).all());
  const kelasLabel = `${mapel[0]?.nama ?? t("class")} · ${kelas.jenjang}`;
  const sesiTanggal = await collect(
    db.orm.public.SesiPertemuan.where((s) => s.jadwalItemId.in(jadwal.map((j) => j.id)))
      .where((s) => s.tanggalPertemuan.eq(tanggal)).all(),
  );
  const sesiBySlot = new Map(sesiTanggal.map((s) => [s.jadwalItemId, s]));
  // A stored occurrence remains valid after the recurring weekday changes.
  const cocokTanggal = (j: (typeof jadwal)[number]) => j.hari === hari || sesiBySlot.has(j.id);
  const sesiDipilih = sesiParam ? jadwal.find((j) => String(j.id) === sesiParam && cocokTanggal(j)) : undefined;
  if (sesiParam !== undefined && !sesiDipilih) notFound();
  const item = sesiDipilih ?? jadwal.find((j) => cocokTanggal(j) && sesiBySlot.get(j.id)?.statusSesi !== "dibatalkan");
  const sesiHariIni = jadwal.filter(cocokTanggal)
    .filter((j) => sesiBySlot.get(j.id)?.statusSesi !== "dibatalkan")
    .map((j) => {
      const tersimpan = sesiBySlot.get(j.id);
      return { ...j, jamMulai: tersimpan?.jamMulai ?? j.jamMulai, jamSelesai: tersimpan?.jamSelesai ?? j.jamSelesai };
    });

  if (!item) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
        <Link
          href={`/teacher/classes/${kid}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>{t("backToClass")}</span>
        </Link>
        <div className="rounded-lg border border-slate-200 bg-white p-12 text-center shadow-2xs">
          <p className="text-base font-bold text-slate-900">{t("notTeachingDate", { date })}</p>
          <p className="mt-1 text-xs text-slate-500">
            {t("classSchedule", { schedule: jadwal.map((j) => t(`day_${j.hari}`)).join(", ") || t("notScheduledAdmin") })}
          </p>
          <div className="mt-6 flex justify-center">
            <Link
              href={`/teacher/classes/${kid}`}
              className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              <ArrowLeft className="size-3.5" />
              <span>{t("backToClass")}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const sesiTersimpan = sesiBySlot.get(item.id);
  if (sesiTersimpan?.statusSesi === "dibatalkan") notFound();

  const [pendaftaranKelas, existing, semuaAnak, catatanPertemuanRows] = await Promise.all([
    collect(
      db.orm.public.Pendaftaran.where((p) => p.kelasId.eq(kid)).all(),
    ),
    collect(
      db.orm.public.Presensi.where((x) => x.jadwalItemId.eq(item.id))
        .where((x) => x.tanggalPertemuan.eq(tanggal))
        .all(),
    ),
    collect(db.orm.public.Anak.all()),
    sesiTersimpan
      ? collect(db.orm.public.CatatanPertemuan.where((c) => c.sesiId.eq(sesiTersimpan.id)).all())
      : Promise.resolve([]),
  ]);
  const catatanPertemuan = catatanPertemuanRows[0];
  const anakById = new Map(semuaAnak.map((a) => [a.id, a]));

  const existingMap = new Map(existing.map((e) => [e.pendaftaranId, e]));
  // Preserve pupils with recorded attendance for this date after withdrawal.
  const siswa = pendaftaranKelas.filter((p) =>
    p.status === "terdaftar" || p.status === "tertunggak" || existingMap.has(p.id),
  );
  const anakList = siswa.map((s) => {
    const lama = existingMap.get(s.id);
    return {
      pendaftaranId: s.id,
      nama: anakById.get(s.anakId)?.nama ?? t("childFallback", { id: s.anakId }),
      anakId: s.anakId,
      jenjangTerakhir: anakById.get(s.anakId)?.jenjangTerakhir ?? null,
      status: lama?.status,
      catatan: lama?.catatan ?? "",
      terkunci: lama ? !dalamJendela7Hari(lama.createdAt) : false,
    };
  });

  const terisi = existing.length;
  const perluPerhatian = existing.filter((x) => STATUS_WARN.has(x.status)).length;
  const terkunciN = anakList.filter((a) => a.terkunci).length;

  const jamMulaiText = (sesiTersimpan?.jamMulai ?? item.jamMulai).slice(0, 5);
  const jamSelesaiText = (sesiTersimpan?.jamSelesai ?? item.jamSelesai).slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
      {/* Top Navigation */}
      <div>
        <Link
          href={`/teacher/classes/${kid}`}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          <span>Kembali ke Detail Kelas</span>
        </Link>
      </div>

      {/* Title & Metadata */}
      <div className="border-b border-slate-200 pb-5">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
          {t("attendanceTitle", {
            day: t(`day_${hari}`),
            date: new Date(`${date}T00:00:00+07:00`).toLocaleDateString(
              locale === "en" ? "en-GB" : "id-ID",
              { timeZone: "Asia/Jakarta" }
            ),
          })}
        </h1>
        <p className="mt-1 text-xs text-slate-500">
          {kelasLabel} · Pukul {jamMulaiText} - {jamSelesaiText} WIB
        </p>

        {/* Multi-session selector (if class has multiple sessions in 1 day) */}
        {sesiHariIni.length > 1 ? (
          <nav aria-label={t("chooseTodaySession")} className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-xs font-medium text-slate-500 mr-1">Pilih Sesi:</span>
            {sesiHariIni.map((j) => (
              <Link
                key={j.id}
                href={`/teacher/classes/${kid}/sessions/${date}/attendance?sesi=${j.id}`}
                aria-current={j.id === item.id ? "page" : undefined}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${
                  j.id === item.id
                    ? "bg-blue-600 text-white shadow-xs"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                }`}
              >
                <span className="tabular-nums">{j.jamMulai.slice(0, 5)} - {j.jamSelesai.slice(0, 5)}</span>
              </Link>
            ))}
          </nav>
        ) : null}
      </div>

      {/* 4-Stat Strip */}
      <SessionStatStrip
        totalSiswa={siswa.length}
        terisi={terisi}
        perluPerhatian={perluPerhatian}
        terkunciN={terkunciN}
      />

      {/* Attendance & Session Notes Dual-Tab Manager */}
      <TeacherAttendanceManager
        kelasId={kid}
        jadwalItemId={item.id}
        tanggal={tanggal}
        siswa={anakList}
        classNameTitle={kelasLabel}
        catatanPertemuan={
          catatanPertemuan
            ? {
                materi: catatanPertemuan.materi,
                pr: catatanPertemuan.pr,
                draf: catatanPertemuan.draf,
                diterbitkanPada: catatanPertemuan.diterbitkanPada,
              }
            : null
        }
      />
    </div>
  );
}
