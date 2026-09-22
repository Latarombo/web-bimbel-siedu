import { getTranslations, getLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { rencanakanSesi } from "@/lib/rencana-sesi";
import { tanggalWIB, hariDariTanggal } from "@/lib/hari";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";

export const dynamic = "force-dynamic";

/*
 * Jadwal mengajar guru — bahasa visual sama dengan dashboard baru (hero
 * gradient, kartu putih rounded, sorot border kiri per status), sengaja beda
 * dari shell admin. Agenda dikelompokkan per tanggal; logika data (planner
 * sesi, merge stored, filter tab/kelas) TIDAK diubah. GET tetap read-only.
 */

function Icon({ d, className }: { d: string; className: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}
const P = {
  calendar: "M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z",
  clock: "M12 6v6l4 2M12 22a10 10 0 100-20 10 10 0 000 20z",
  check: "M20 6L9 17l-5-5",
};

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
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 p-6 text-white shadow-lg shadow-blue-600/20 sm:p-8">
          <h1 className="font-display text-3xl font-extrabold tracking-tight sm:text-4xl">{t("calendarTitle")}</h1>
          <p className="mt-2 text-sm text-blue-100">{t("calendarDescription")}</p>
        </header>
        <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm font-semibold text-slate-500">{t("noAssignedClasses")}</p>
        </div>
      </div>
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

  const upcomingCount = allSessions.filter((s) => !s.isPast).length;
  const pastCount = allSessions.filter((s) => s.isPast).length;
  const todayCount = allSessions.filter((s) => s.isToday && s.statusSesi !== "dibatalkan").length;

  const tabs = [
    { key: "all", label: t("viewAll"), count: allSessions.length },
    { key: "upcoming", label: t("upcomingSession"), count: upcomingCount },
    { key: "past", label: t("pastSession"), count: pastCount },
  ];

  const heroStats = [
    { icon: P.calendar, value: allSessions.length, label: t("viewAll") },
    { icon: P.clock, value: todayCount, label: t("todaySessions") },
    { icon: P.check, value: upcomingCount, label: t("upcomingSession") },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      {/* HERO + STAT STRIP (bahasa visual dashboard) */}
      <header className="overflow-hidden rounded-3xl bg-gradient-to-br from-blue-700 via-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/20">
        <div className="flex flex-col gap-6 p-6 sm:p-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-3xl font-extrabold tracking-tight text-balance sm:text-4xl">{t("calendarTitle")}</h1>
            <p className="mt-2 text-sm text-blue-100">{t("calendarDescription")}</p>
          </div>
          <div className="grid grid-cols-3 gap-2.5">
            {heroStats.map((s) => (
              <div key={s.label} className="rounded-2xl bg-white/15 px-4 py-3 backdrop-blur">
                <Icon d={s.icon} className="size-4 text-blue-100" />
                <p className="mt-1.5 font-display text-2xl font-extrabold leading-none tabular-nums">{s.value}</p>
                <p className="mt-1 text-[11px] font-medium text-blue-100">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </header>

      {/* Filter tab + kelas */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <nav aria-label={t("viewAll")} className="inline-flex flex-wrap rounded-full bg-slate-200/70 p-1">
          {tabs.map((tab) => (
            <Link
              key={tab.key}
              href={`/teacher/calendar?tab=${tab.key}${selectedKelasId ? `&kelas=${selectedKelasId}` : ""}`}
              aria-current={activeTab === tab.key ? "page" : undefined}
              className={`inline-flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-semibold transition-colors ${
                activeTab === tab.key ? "bg-white text-blue-700 shadow-sm" : "text-slate-700 hover:text-slate-900"
              }`}
            >
              {tab.label}
              <span className={`rounded-full px-1.5 text-[11px] font-bold tabular-nums ${activeTab === tab.key ? "bg-blue-100 text-blue-800" : "bg-white/70 text-slate-600"}`}>
                {tab.count}
              </span>
            </Link>
          ))}
        </nav>

        {kelasList.length > 1 ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500">{t("filterClass")}</span>
            <Link
              href={`/teacher/calendar?tab=${activeTab}`}
              className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                selectedKelasId === null ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {t("allClasses")}
            </Link>
            {kelasList.map((k) => (
              <Link
                key={k.id}
                href={`/teacher/calendar?tab=${activeTab}&kelas=${k.id}`}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
                  selectedKelasId === k.id ? "bg-blue-600 text-white" : "border border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {mapelMap.get(k.mataPelajaranId)} {k.jenjang}
              </Link>
            ))}
          </div>
        ) : null}
      </div>

      {/* Agenda per tanggal */}
      <div className="mt-6 space-y-6">
        {sessionsByDate.size === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{t("noUpcomingSessions")}</p>
          </div>
        ) : (
          [...sessionsByDate.entries()].map(([dateStr, items]) => {
            const hariNama = t(`day_${hariDariTanggal(dateStr)}`);
            const dateFormatted = new Date(`${dateStr}T00:00:00+07:00`).toLocaleDateString(
              locale === "en" ? "en-GB" : "id-ID",
              { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Jakarta" },
            );
            const isDateToday = dateStr === hariIni;

            return (
              <section key={dateStr} className="space-y-3">
                <div className="flex items-center gap-2 px-1">
                  <h2 className="font-display text-sm font-bold tracking-tight text-slate-900">
                    {hariNama}, {dateFormatted}
                  </h2>
                  <span className="text-xs text-slate-400">·</span>
                  <span className="text-xs font-medium text-slate-500">{t("sessionsCount", { count: items.length })}</span>
                  {isDateToday ? <Badge tone="brand">{t("todaySession")}</Badge> : null}
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {items.map((item) => {
                    const isCancelled = item.statusSesi === "dibatalkan";
                    const isFilled = item.presensiCount > 0;
                    const attendanceUrl = `/teacher/classes/${item.kelasId}/sessions/${item.tanggalPertemuan}/attendance?sesi=${item.jadwalItemId}`;
                    // Sorot border kiri per status: merah batal, hijau terisi, biru hari ini, netral sisanya
                    const accent = isCancelled
                      ? "border-l-rose-400"
                      : isFilled
                        ? "border-l-emerald-500"
                        : item.isToday
                          ? "border-l-blue-600"
                          : "border-l-slate-200";

                    return (
                      <div
                        key={`${item.jadwalItemId}-${item.tanggalPertemuan}`}
                        className={`flex flex-col rounded-2xl border border-slate-200 border-l-4 bg-white p-4 shadow-sm transition-shadow hover:shadow-md ${accent} ${isCancelled ? "bg-rose-50/30" : ""}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-xs font-semibold tabular-nums text-slate-700">
                              {item.jamMulai}s.d.{item.jamSelesai}
                            </span>
                            <h3 className="mt-2 truncate text-sm font-bold text-slate-900">{item.kelasNama}</h3>
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

                        <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3">
                          <span className="text-xs tabular-nums text-slate-500">
                            {item.presensiCount}/{item.pesertaCount} {t("present")}
                          </span>
                          {isCancelled ? (
                            <span className="text-xs font-semibold text-rose-600">{t("sessionCancelled")}</span>
                          ) : (
                            <ButtonLink href={attendanceUrl} size="sm" variant={isFilled ? "outline" : "default"}>
                              {isFilled ? t("viewSession") : t("recordAttendance")}
                            </ButtonLink>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })
        )}
      </div>
    </div>
  );
}
