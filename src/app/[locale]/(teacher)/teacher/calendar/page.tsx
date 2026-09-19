import { getTranslations, getLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { rencanakanSesi } from "@/lib/rencana-sesi";
import { tanggalWIB, hariDariTanggal } from "@/lib/hari";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { PageShell, PageHeader, Panel } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

interface CalendarPageProps {
  searchParams: Promise<{
    kelas?: string;
    tab?: string;
  }>;
}

export default async function TeacherCalendarPage({ searchParams }: CalendarPageProps) {
  const t = await getTranslations("teacher");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) return redirect({ href: "/login?next=/teacher/calendar", locale });
  const guruId = Number(session.user.id);

  const { kelas: kelasFilterParam, tab: tabParam } = await searchParams;
  const selectedKelasId = kelasFilterParam ? Number(kelasFilterParam) : null;
  const activeTab = tabParam ?? "all"; // 'all' | 'upcoming' | 'past'

  const kelasList = await collect(
    db.orm.public.Kelas.where((k) => k.guruId.eq(guruId)).all(),
  );
  const kelasIds = kelasList.map((k) => k.id);

  if (kelasList.length === 0) {
    return (
      <PageShell>
        <PageHeader title={t("calendarTitle")} desc={t("calendarDescription")} />
        <Panel className="mt-6 p-8 text-center text-slate-500">
          <p className="text-sm font-medium">{t("noClasses")}</p>
        </Panel>
      </PageShell>
    );
  }

  const [periodeList, mapelList, jadwalList, pendaftaranList, presensiList] = await Promise.all([
    collect(db.orm.public.PeriodePendaftaran.where((p) => p.id.in(kelasList.map((k) => k.periodeId))).all()),
    collect(db.orm.public.MataPelajaran.all()),
    collect(db.orm.public.JadwalItem.where((j) => j.kelasId.in(kelasIds)).all()),
    collect(db.orm.public.Pendaftaran.where((p) => p.kelasId.in(kelasIds)).all()),
    collect(db.orm.public.Presensi.where((x) => x.dicatatOleh.eq(guruId)).all()),
  ]);

  const slotIds = jadwalList.map((j) => j.id);
  const storedSessions = slotIds.length > 0
    ? await collect(db.orm.public.SesiPertemuan.where((s) => s.jadwalItemId.in(slotIds)).all())
    : [];

  const periodeMap = new Map(periodeList.map((p) => [p.id, p]));
  const mapelMap = new Map(mapelList.map((m) => [m.id, m.nama]));
  const storedBySlotAndDate = new Map(
    storedSessions.map((s) => [`${s.jadwalItemId}:${s.tanggalPertemuan}`, s]),
  );

  // Map attendance by slot + date
  const attendanceBySlotAndDate = new Map<string, number>();
  for (const pres of presensiList) {
    const key = `${pres.jadwalItemId}:${pres.tanggalPertemuan}`;
    attendanceBySlotAndDate.set(key, (attendanceBySlotAndDate.get(key) ?? 0) + 1);
  }

  // Count active students per class
  const activeStudentsPerClass = new Map<number, number>();
  for (const p of pendaftaranList) {
    if (p.kelasId !== undefined && ["terdaftar", "tertunggak"].includes(p.status)) {
      activeStudentsPerClass.set(p.kelasId, (activeStudentsPerClass.get(p.kelasId) ?? 0) + 1);
    }
  }

  const hariIni = tanggalWIB(new Date());

  // Generate sessions for all active classes
  type SessionCardItem = {
    kelasId: number;
    jadwalItemId: number;
    tanggalPertemuan: string;
    jamMulai: string;
    jamSelesai: string;
    kelasNama: string;
    jenjang: string;
    statusSesi: string;
    pesertaCount: number;
    presensiCount: number;
    isPast: boolean;
    isToday: boolean;
  };

  const allSessions: SessionCardItem[] = [];

  for (const k of kelasList) {
    if (k.status === "dibatalkan") continue;
    if (selectedKelasId && k.id !== selectedKelasId) continue;

    const periode = periodeMap.get(k.periodeId);
    if (!periode) continue;

    const classSlots = jadwalList.filter((j) => j.kelasId === k.id);
    if (classSlots.length === 0) continue;

    const storedForClass = storedSessions.filter((s) => classSlots.some((slot) => slot.id === s.jadwalItemId));
    const planned = rencanakanSesi(
      periode.tanggalMulai,
      periode.tanggalSelesai,
      classSlots,
      storedForClass,
    );

    const merged = [
      ...storedForClass.map((s) => ({
        jadwalItemId: s.jadwalItemId,
        tanggalPertemuan: s.tanggalPertemuan,
        jamMulai: s.jamMulai,
        jamSelesai: s.jamSelesai,
        statusSesi: s.statusSesi,
      })),
      ...planned.map((p) => ({
        jadwalItemId: p.jadwalItemId,
        tanggalPertemuan: p.tanggalPertemuan,
        jamMulai: p.jamMulai,
        jamSelesai: p.jamSelesai,
        statusSesi: "terjadwal",
      })),
    ];

    const namaMapel = mapelMap.get(k.mataPelajaranId) ?? t("class");

    for (const sessionItem of merged) {
      const key = `${sessionItem.jadwalItemId}:${sessionItem.tanggalPertemuan}`;
      const stored = storedBySlotAndDate.get(key);
      const isPast = sessionItem.tanggalPertemuan < hariIni;
      const isToday = sessionItem.tanggalPertemuan === hariIni;

      allSessions.push({
        kelasId: k.id,
        jadwalItemId: sessionItem.jadwalItemId,
        tanggalPertemuan: sessionItem.tanggalPertemuan,
        jamMulai: (stored?.jamMulai ?? sessionItem.jamMulai).slice(0, 5),
        jamSelesai: (stored?.jamSelesai ?? sessionItem.jamSelesai).slice(0, 5),
        kelasNama: namaMapel,
        jenjang: k.jenjang,
        statusSesi: stored?.statusSesi ?? sessionItem.statusSesi,
        pesertaCount: activeStudentsPerClass.get(k.id) ?? 0,
        presensiCount: attendanceBySlotAndDate.get(key) ?? 0,
        isPast,
        isToday,
      });
    }
  }

  // Sort chronologically
  allSessions.sort((a, b) => {
    if (a.tanggalPertemuan !== b.tanggalPertemuan) {
      return a.tanggalPertemuan.localeCompare(b.tanggalPertemuan);
    }
    return a.jamMulai.localeCompare(b.jamMulai);
  });

  // Filter based on active tab
  const filteredSessions = allSessions.filter((s) => {
    if (activeTab === "upcoming") return !s.isPast;
    if (activeTab === "past") return s.isPast;
    return true;
  });

  // Group by date
  const sessionsByDate = new Map<string, SessionCardItem[]>();
  for (const s of filteredSessions) {
    const list = sessionsByDate.get(s.tanggalPertemuan) ?? [];
    list.push(s);
    sessionsByDate.set(s.tanggalPertemuan, list);
  }

  return (
    <PageShell>
      <PageHeader
        title={t("calendarTitle")}
        desc={t("calendarDescription")}
      />

      {/* Filter and Tab navigation */}
      <div className="mt-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-slate-200/80 bg-slate-100/70 p-1 text-xs">
          {[
            { key: "all", label: `${t("viewAll")} (${allSessions.length})` },
            { key: "upcoming", label: `${t("upcomingSession")} (${allSessions.filter((s) => !s.isPast).length})` },
            { key: "past", label: `${t("pastSession")} (${allSessions.filter((s) => s.isPast).length})` },
          ].map((tab) => (
            <Link
              key={tab.key}
              href={`/teacher/calendar?tab=${tab.key}${selectedKelasId ? `&kelas=${selectedKelasId}` : ""}`}
              className={`rounded-md px-3 py-1.5 font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              {tab.label}
            </Link>
          ))}
        </div>

        {/* Class Filter */}
        {kelasList.length > 1 ? (
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500">{t("filterClass")}:</span>
            <div className="flex flex-wrap gap-1">
              <Link
                href={`/teacher/calendar?tab=${activeTab}`}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  selectedKelasId === null
                    ? "bg-slate-900 text-white"
                    : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {t("allClasses")}
              </Link>
              {kelasList.map((k) => (
                <Link
                  key={k.id}
                  href={`/teacher/calendar?tab=${activeTab}&kelas=${k.id}`}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    selectedKelasId === k.id
                      ? "bg-slate-900 text-white"
                      : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {mapelMap.get(k.mataPelajaranId)} {k.jenjang}
                </Link>
              ))}
            </div>
          </div>
        ) : null}
      </div>

      {/* Sessions list */}
      <div className="mt-6 space-y-6">
        {sessionsByDate.size === 0 ? (
          <Panel className="p-10 text-center text-slate-500">
            <p className="text-sm">{t("noUpcomingSessions")}</p>
          </Panel>
        ) : (
          [...sessionsByDate.entries()].map(([dateStr, items]) => {
            const hariNama = t(`day_${hariDariTanggal(dateStr)}`);
            const dateFormatted = new Date(`${dateStr}T00:00:00+07:00`).toLocaleDateString(
              locale === "en" ? "en-GB" : "id-ID",
              { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" },
            );
            const isDateToday = dateStr === hariIni;

            return (
              <div key={dateStr} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <h3 className="text-sm font-bold text-slate-800">
                    {hariNama}, {dateFormatted}
                  </h3>
                  {isDateToday ? (
                    <Badge tone="brand">{t("todaySession")}</Badge>
                  ) : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => {
                    const isCancelled = item.statusSesi === "dibatalkan";
                    const isFilled = item.presensiCount > 0;
                    const attendanceUrl = `/teacher/classes/${item.kelasId}/sessions/${item.tanggalPertemuan}/attendance?sesi=${item.jadwalItemId}`;

                    return (
                      <Panel
                        key={`${item.jadwalItemId}-${item.tanggalPertemuan}`}
                        className={`p-4 transition-shadow hover:shadow-md ${
                          isCancelled ? "border-rose-200 bg-rose-50/20" : ""
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="rounded bg-slate-100 px-2 py-0.5 font-mono text-xs font-semibold text-slate-700">
                              {item.jamMulai} - {item.jamSelesai} {t("timeZone")}
                            </span>
                            <h4 className="mt-2 text-sm font-bold text-slate-900">
                              {item.kelasNama}
                            </h4>
                            <p className="text-xs text-slate-500">{item.jenjang}</p>
                          </div>

                          {isCancelled ? (
                            <Badge tone="red">{t("sessionCancelled")}</Badge>
                          ) : isFilled ? (
                            <Badge tone="emerald">{t("attendanceCompleted")}</Badge>
                          ) : (
                            <Badge tone="amber">{t("attendancePending")}</Badge>
                          )}
                        </div>

                        <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
                          <span>
                            {item.presensiCount}/{item.pesertaCount} {t("present")}
                          </span>

                          {isCancelled ? (
                            <span className="font-semibold text-rose-600">{t("sessionCancelled")}</span>
                          ) : (
                            <ButtonLink
                              href={attendanceUrl}
                              variant={isFilled ? "outline" : "default"}
                              className="h-8 px-3 text-xs"
                            >
                              {isFilled ? t("viewSession") : t("recordAttendance")}
                            </ButtonLink>
                          )}
                        </div>
                      </Panel>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>
    </PageShell>
  );
}
