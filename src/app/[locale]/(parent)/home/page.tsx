import { getTranslations, getLocale } from "next-intl/server";
import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge, type StatusPendaftaran } from "@/components/status-badge";
import { ProgressRow, SegmentBar } from "@/components/ui/progress-row";
import { NilaiTrendChart } from "@/components/parent/nilai-trend-chart";
import { RingProgres, GridKehadiran } from "@/components/parent/visual-ring";
import { dashboardOrangTua, type AnakDashboard } from "@/lib/orang-tua-dashboard";
import { rupiah } from "@/lib/format";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { filterStatusForParent } from "@/lib/status-pembelajaran";
import {
  LearningStatusInlineStory,
  type LearningStatusItem,
} from "@/components/parent/learning-status-inline-story";
import { ChildSwitcherDropdown } from "@/components/parent/child-switcher-dropdown";
import { StudentAvatar } from "@/components/parent/student-avatar";
import { SITE } from "@/lib/site";
import {
  Calendar,
  Camera,
  Sparkles,
  Quote,
  CheckCircle2,
  AlertTriangle,
  UserPlus,
  Users,
  BookOpen,
  Check,
  ArrowRight,
} from "lucide-react";

export const dynamic = "force-dynamic";

function tanggalPendek(iso: string) {
  return new Date(iso).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
  });
}

const HARI_URUT = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

/** Tandai jadwal 'sekarang' (hari ini, jam berjalan) atau 'berikutnya' (paling dekat). */
function tandaiJadwal(jadwal: AnakDashboard["jadwal"]) {
  const now = new Date();
  const hariIni = HARI_URUT[now.getDay()];
  const jamIni = now.toTimeString().slice(0, 5);
  let idxSekarang = -1;
  for (let i = 0; i < jadwal.length; i++) {
    const j = jadwal[i];
    if (j.hari === hariIni && j.mulai <= jamIni && jamIni <= j.selesai) {
      idxSekarang = i;
      break;
    }
  }
  let idxBerikut = -1;
  const terurut = jadwal
    .map((j, i) => ({ i, key: `${j.tanggalBerikutnya ?? "9999"}${j.mulai}` }))
    .sort((a, b) => a.key.localeCompare(b.key));
  for (const { i } of terurut) {
    if (i !== idxSekarang) {
      idxBerikut = i;
      break;
    }
  }
  return { idxSekarang, idxBerikut };
}

/** Alert paling mendesak untuk satu anak, atau null kalau aman. */
function alertMendesak(
  a: AnakDashboard,
  tr: (k: string, v?: Record<string, string | number>) => string,
): { teks: string; tone: "rose" | "amber" } | null {
  if (a.tertunggak) return { teks: tr("dashUrgentTunggak"), tone: "rose" };
  if (a.menungguPembayaran) return { teks: tr("dashUrgentPending"), tone: "amber" };
  if (a.presensi.alpa > 0)
    return { teks: tr("dashUrgentAlpa", { n: a.presensi.alpa }), tone: "amber" };
  return null;
}

function BelumAdaProfilState({
  userName,
  tr,
}: {
  userName: string | null;
  tr: (k: string, v?: Record<string, string | number>) => string;
}) {
  const waHref = `https://wa.me/${SITE.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    tr("waTextParentNoProfile")
  )}`;

  return (
    <div className="min-h-full bg-slate-50/50 pb-20">
      {/* 1. Hero Welcome Header */}
      <section className="relative overflow-hidden bg-[#1d4ed8] text-white pt-8 pb-20 sm:pt-10 sm:pb-24 px-4 sm:px-6 lg:px-8 border-b border-blue-900/20 shadow-xs">
        {/* Gelombang sudut tanpa gradient persis halaman katalog */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <svg
            className="absolute -right-8 -top-8 w-72 sm:w-96 md:w-[480px]"
            viewBox="0 0 400 280"
            fill="none"
          >
            <path d="M120 0 C200 45, 290 110, 400 240 L400 0 Z" fill="white" fillOpacity="0.05" />
            <path d="M190 0 C260 40, 330 95, 400 180 L400 0 Z" fill="white" fillOpacity="0.07" />
            <path d="M270 0 C325 30, 365 65, 400 120 L400 0 Z" fill="white" fillOpacity="0.09" />
          </svg>

          <svg
            className="absolute -left-8 -bottom-8 w-64 sm:w-80 md:w-[420px]"
            viewBox="0 0 360 260"
            fill="none"
          >
            <path d="M0 60 C90 105, 180 175, 280 260 L0 260 Z" fill="white" fillOpacity="0.05" />
            <path d="M0 120 C75 155, 145 205, 210 260 L0 260 Z" fill="white" fillOpacity="0.07" />
            <path d="M0 180 C50 205, 100 230, 140 260 L0 260 Z" fill="white" fillOpacity="0.08" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-5xl">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight text-white">
            {tr("welcomeTitle", {
              name: userName ?? tr("defaultParentGreeting"),
            })}
          </h1>
          <p className="mt-2.5 max-w-2xl text-xs sm:text-sm lg:text-base text-blue-100/90 leading-relaxed font-medium">
            {tr("welcomeDesc")}
          </p>
        </div>
      </section>

      {/* 2. Konten Onboarding melayang ke hero */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-12 space-y-8">
        {/* Card Utama: 3 Langkah Memulai */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 lg:p-10 shadow-sm space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <span className="text-xs font-semibold text-blue-600">
                {tr("quickStartBadge")}
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5 tracking-tight">
                {tr("quickStartTitle")}
              </h2>
            </div>
            <Link
              href="/children/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-all active:scale-[0.98] hover:brightness-95 shrink-0 cursor-pointer"
              style={{ backgroundColor: "#f26d0f" }}
            >
              <UserPlus className="size-4" />
              {tr("bentoAddChildTitle")}
            </Link>
          </div>

          {/* Stepper Grid 3 Kolom */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Step 1 - Sedang Aktif */}
            <div className="relative rounded-2xl border-2 border-blue-500 bg-blue-50/40 p-5 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white shadow-2xs">
                    1
                  </span>
                  <span className="rounded-full bg-blue-100 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                    {tr("step1Badge")}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {tr("step1Title")}
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  {tr("step1Desc")}
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-blue-100">
                <Link
                  href="/children/new"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 group cursor-pointer"
                >
                  <span>{tr("step1Cta")}</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                    2
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {tr("step2Badge")}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {tr("step2Title")}
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                  {tr("step2Desc")}
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-200/60">
                <Link
                  href="/classes"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 group cursor-pointer"
                >
                  <span>{tr("step2Cta")}</span>
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-2xl border border-slate-200/80 bg-slate-50/70 p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <span className="flex size-7 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-600">
                    3
                  </span>
                  <span className="text-[11px] font-medium text-slate-400">
                    {tr("step3Badge")}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {tr("step3Title")}
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                  {tr("step3Desc")}
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-200/60">
                <span className="text-xs text-slate-400 font-medium">
                  {tr("step3Note")}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Highlight Fitur Utama Dashboard */}
        <div>
          <div className="text-center max-w-xl mx-auto mb-6">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {tr("monitorTitle")}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {tr("monitorDesc")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Camera className="size-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                {tr("monitorStoriesTitle")}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {tr("monitorStoriesDesc")}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Calendar className="size-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                {tr("monitorAttendanceTitle")}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {tr("monitorAttendanceDesc")}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Quote className="size-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                {tr("monitorNotesTitle")}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {tr("monitorNotesDesc")}
              </p>
            </div>
          </div>
        </div>

        {/* 4. Banner Bantuan WhatsApp */}
        <div className="rounded-2xl border border-blue-100 bg-blue-50/70 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <div className="size-10 rounded-full bg-blue-600 text-white grid place-items-center shrink-0 hidden sm:grid">
              <Sparkles className="size-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                {tr("helpChoosingTitle")}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {tr("helpChoosingDesc")}
              </p>
            </div>
          </div>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs shrink-0 cursor-pointer"
          >
            {tr("consultWhatsapp")}
          </a>
        </div>
      </div>
    </div>
  );
}

function BelumDaftarKelasState({
  anak,
  locale,
  tr,
}: {
  anak: AnakDashboard;
  locale: string;
  tr: (k: string, v?: Record<string, string | number>) => string;
}) {
  const catalogUrl = anak.jenjang
    ? `/classes?jenjang=${encodeURIComponent(anak.jenjang)}`
    : "/classes";

  return (
    <div className="space-y-8">
      {/* Banner Langkah Selanjutnya */}
      <div className="rounded-2xl sm:rounded-3xl border border-blue-200/80 bg-blue-50/70 p-6 sm:p-8 lg:p-10 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl space-y-3.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100/90 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-800">
              <CheckCircle2 className="size-3.5 text-blue-600" />
              {tr("profileCreatedBadge")}
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {tr("nextStepChooseClass", { name: anak.nama })}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {tr("enrollClassHint", {
                name: anak.nama,
                level: anak.jenjang || (locale === "en" ? "General" : "Umum"),
              })}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href={catalogUrl}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-xs transition-all active:scale-[0.98] hover:brightness-95 cursor-pointer"
                style={{ backgroundColor: "#f26d0f" }}
              >
                <BookOpen className="size-4" />
                {tr("chooseClassFor", { name: anak.nama })}
              </Link>
              <Link
                href="/classes"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                {tr("exploreAllPrograms")}
              </Link>
            </div>
          </div>

          {/* Badge Ringkasan Jenjang Terpilih */}
          <div className="rounded-2xl border border-blue-100 bg-white/90 p-5 lg:w-72 shadow-2xs space-y-3 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-xl bg-blue-100 text-blue-800 font-bold text-base uppercase">
                {anak.nama.charAt(0)}
              </div>
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-slate-900 truncate">{anak.nama}</h4>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded mt-0.5 inline-block">
                  {tr("levelBadge", { level: anak.jenjang || tr("levelNotSet") })}
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-500 border-t border-slate-100 pt-3 space-y-2">
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="size-3.5 text-emerald-600 shrink-0" />
                <span>{tr("benefitModules")}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="size-3.5 text-emerald-600 shrink-0" />
                <span>{tr("benefitAcClass")}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="size-3.5 text-emerald-600 shrink-0" />
                <span>{tr("benefitHomework")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3 Langkah Alur Belajar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <span className="flex size-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 mb-3">
            1
          </span>
          <h4 className="font-bold text-sm text-slate-900">
            {tr("flowStep1Title")}
          </h4>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            {tr("flowStep1Desc")}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <span className="flex size-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 mb-3">
            2
          </span>
          <h4 className="font-bold text-sm text-slate-900">
            {tr("flowStep2Title")}
          </h4>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            {tr("flowStep2Desc")}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <span className="flex size-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 mb-3">
            3
          </span>
          <h4 className="font-bold text-sm text-slate-900">
            {tr("flowStep3Title")}
          </h4>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            {tr("flowStep3Desc")}
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function ParentHome({
  searchParams,
}: {
  searchParams: Promise<{ anak?: string }>;
}) {
  const tr = await getTranslations("parent");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) {
    return redirect({ href: "/login?next=/home", locale });
  }
  const ortuId = Number(session.user.id);
  const { anak: anakParam } = await searchParams;

  const anakList = await dashboardOrangTua(ortuId);

  if (anakList.length === 0) {
    return (
      <BelumAdaProfilState
        userName={session.user.name ?? null}
        tr={tr}
      />
    );
  }

  const dipilih =
    anakList.find((a) => String(a.id) === anakParam) ?? anakList[0];
  const t = dipilih.tagihan;
  const alert = alertMendesak(dipilih, tr);
  const { idxSekarang, idxBerikut } = tandaiJadwal(dipilih.jadwal);

  // Rata-rata nilai (untuk ring akademik) + pertumbuhan
  const rataNilai =
    dipilih.nilai.length > 0
      ? Math.round(
          dipilih.nilai.reduce((s, n) => s + n.nilai, 0) / dipilih.nilai.length,
        )
      : null;
  const pertumbuhan =
    dipilih.nilai.length >= 2
      ? dipilih.nilai[dipilih.nilai.length - 1].nilai - dipilih.nilai[0].nilai
      : null;

  // Kabar & Status Pembelajaran untuk anak terpilih
  const [allStatusList, allReceipts, allClasses, allMapel, allUsers, allPendaftaran] =
    await Promise.all([
      collect(db.orm.public.StatusPembelajaran.where((s) => s.status.eq("aktif")).all()),
      collect(db.orm.public.StatusPembelajaranPenerima.all()),
      collect(db.orm.public.Kelas.all()),
      collect(db.orm.public.MataPelajaran.all()),
      collect(db.orm.public.User.all()),
      collect(db.orm.public.Pendaftaran.where((p) => p.anakId.eq(dipilih.id)).all()),
    ]);

  const activeEnrollments = allPendaftaran.filter((p) =>
    ["terdaftar", "tertunggak"].includes(p.status),
  );
  const nowIso = new Date().toISOString();

  const visibleStatuses = filterStatusForParent({
    statusList: allStatusList,
    receipts: allReceipts,
    parentChildIds: [dipilih.id],
    activeEnrollmentIds: activeEnrollments.map((p) => p.id),
    nowIso,
  });

  const kelasMap = new Map(allClasses.map((k) => [k.id, k]));
  const mapelMap = new Map(allMapel.map((m) => [m.id, m.nama]));
  const userMap = new Map(allUsers.map((u) => [u.id, u.name]));

  const learningStatuses: LearningStatusItem[] = visibleStatuses.map((s) => {
    const k = kelasMap.get(s.kelasId);
    const kelasNama = k
      ? `${mapelMap.get(k.mataPelajaranId) ?? "Kelas"} #${k.id}`
      : `Kelas #${s.kelasId}`;
    const guruNama = k ? (userMap.get(k.guruId) ?? undefined) : undefined;
    let mediaUrls: string[] = [];
    if (s.mediaUrls) {
      try {
        mediaUrls = JSON.parse(s.mediaUrls);
      } catch {
        mediaUrls = [];
      }
    }
    return {
      id: s.id,
      kelasId: s.kelasId,
      kelasNama,
      guruNama,
      kontenTeks: s.kontenTeks,
      mediaUrls,
      diterbitkanPada: s.diterbitkanPada,
    };
  });

  const ringTone =
    (dipilih.persenHadir ?? 0) >= 80
      ? "emerald"
      : (dipilih.persenHadir ?? 0) >= 60
        ? "amber"
        : "blue";

  return (
    <div className="min-h-full bg-slate-50/50 pb-16">
      {/* ========================================================================= */}
      {/* 1. HERO HEADER & SWITCHER ANAK (Persis Halaman Katalog)                     */}
      {/* ========================================================================= */}
      <section className="relative z-20 bg-[#1d4ed8] text-white pt-8 pb-10 sm:pt-10 sm:pb-12 shadow-xs border-b border-blue-900/20">
        {/* Gelombang sudut tanpa gradient persis halaman katalog */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <svg
            className="absolute -right-8 -top-8 w-72 sm:w-96 md:w-[480px]"
            viewBox="0 0 400 280"
            fill="none"
          >
            <path d="M120 0 C200 45, 290 110, 400 240 L400 0 Z" fill="white" fillOpacity="0.05" />
            <path d="M190 0 C260 40, 330 95, 400 180 L400 0 Z" fill="white" fillOpacity="0.07" />
            <path d="M270 0 C325 30, 365 65, 400 120 L400 0 Z" fill="white" fillOpacity="0.09" />
          </svg>

          <svg
            className="absolute -left-8 -bottom-8 w-64 sm:w-80 md:w-[420px]"
            viewBox="0 0 360 260"
            fill="none"
          >
            <path d="M0 60 C90 105, 180 175, 280 260 L0 260 Z" fill="white" fillOpacity="0.05" />
            <path d="M0 120 C75 155, 145 205, 210 260 L0 260 Z" fill="white" fillOpacity="0.07" />
            <path d="M0 180 C50 205, 100 230, 140 260 L0 260 Z" fill="white" fillOpacity="0.08" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Baris Salam Orang Tua + Aksi Kanan (lurus sejajar) */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 text-xs sm:text-sm text-blue-100/90 font-medium mb-4 pb-3 border-b border-blue-400/20">
            <span>
              {tr("text078")} <b>{session.user.name ?? tr("text079")}</b>
            </span>

            {/* Dropdown Profil Anak & Kelola Akun Anak */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <ChildSwitcherDropdown
                anakList={anakList.map((a) => ({
                  id: a.id,
                  nama: a.nama,
                  jenjang: a.jenjang,
                  kelas: a.kelas,
                  tertunggak: a.tertunggak,
                  belumDibayar: a.tagihan?.belumDibayar ?? 0,
                }))}
                dipilihId={dipilih.id}
                label={tr("dashSwitcherLabel")}
                addChildLabel={tr("text008")}
              />

              <ButtonLink
                href="/children"
                size="sm"
                className="h-10 px-3.5 text-xs rounded-xl gap-2.5 bg-white text-brand hover:bg-blue-50 font-bold border-transparent shadow-md transition-colors"
              >
                <Users className="size-3.5" />
                <span>{tr("manageChildAccounts")}</span>
              </ButtonLink>
            </div>
          </div>

          {/* Blok Utama: Identitas Anak Aktif */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* Sisi Kiri: Avatar + Nama Anak + Detail Kelas + Status Pendaftaran */}
            <div className="flex items-start sm:items-center gap-4 min-w-0">
              <StudentAvatar
                nama={dipilih.nama}
                jenjang={dipilih.jenjang}
                size="lg"
                className="ring-2 ring-white/70 shadow-md"
              />
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight truncate">
                    {dipilih.nama}
                  </h1>
                  {dipilih.status ? (
                    <div>
                      <StatusBadge status={dipilih.status as StatusPendaftaran} />
                    </div>
                  ) : null}
                </div>

                <div className="flex flex-wrap items-center gap-2 mt-1 text-xs sm:text-sm text-blue-100/90 font-medium">
                  {dipilih.kelas ? (
                    <span>
                      {dipilih.kelas.mapel}
                      {dipilih.jenjang ? ` · ${dipilih.jenjang}` : ""}
                    </span>
                  ) : (
                    <span className="text-blue-200">{tr("dashHeroBelumKelas")}</span>
                  )}
                  {dipilih.kelas?.guru && (
                    <>
                      <span>•</span>
                      <span>
                        {tr("dashGuruLabel")}: <b>{dipilih.kelas.guru}</b>
                      </span>
                    </>
                  )}
                  {dipilih.kelas?.ruangan && (
                    <>
                      <span>•</span>
                      <span className="inline-flex items-center gap-1 rounded-md bg-white/15 px-2 py-0.5 text-xs font-semibold text-white border border-white/20">
                        🚪 {dipilih.kelas.ruangan}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Konten Dashboard (Banner Alert & Kartu Ringkasan) */}
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 space-y-8">
        {/* Banner Notifikasi Mendesak (Jika ada) */}
        {alert && (
          <div
            className={`flex flex-wrap items-center justify-between gap-3 rounded-2xl border p-4 text-sm shadow-sm ${
              alert.tone === "rose"
                ? "border-rose-200 bg-white text-rose-900 shadow-rose-100/50"
                : "border-amber-200 bg-white text-amber-900 shadow-amber-100/50"
            }`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <AlertTriangle
                className={`h-5 w-5 shrink-0 ${
                  alert.tone === "rose" ? "text-rose-600" : "text-amber-600"
                }`}
              />
              <p className="truncate font-medium">{alert.teks}</p>
            </div>
            {t && t.belumDibayar > 0 && dipilih.pendaftaranId ? (
              <ButtonLink
                href={`/enrollments/${dipilih.pendaftaranId}/pay`}
                size="sm"
                className={
                  alert.tone === "rose"
                    ? "bg-rose-600 hover:bg-rose-700 text-white"
                    : "bg-amber-600 hover:bg-amber-700 text-white"
                }
              >
                {tr("dashActionBayar")}
              </ButtonLink>
            ) : null}
          </div>
        )}

      {/* ========================================================================= */}
      {/* 2. KONTEN DASHBOARD ATAU ONBOARDING PILIH KELAS                          */}
      {/* ========================================================================= */}
      {!dipilih.pendaftaranId ? (
        <BelumDaftarKelasState anak={dipilih} locale={locale} tr={tr} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* ----------------------------------------------------------------------- */}
        {/* KOLOM KIRI (~65%): Jurnal Belajar, Story WA/IG, Catatan Guru, Nilai     */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">

          {/* DOKUMENTASI & STATUS PEMBELAJARAN (WhatsApp/Instagram Status Inline) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                {tr("learningStatusFeedTitle")}
              </h3>
              {learningStatuses.length > 0 && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                  {tr("latestUpdates", { count: learningStatuses.length })}
                </span>
              )}
            </div>

            {/* WA/IG Inline Story Component (No Modal Popups) */}
            <LearningStatusInlineStory statuses={learningStatuses} />
          </section>

          {/* CATATAN PERKEMBANGAN GURU (Editorial Quote) */}
          <section className="space-y-3 pt-2">
            <h3 className="text-sm font-semibold text-slate-900">
              {tr("text124")}
            </h3>

            {dipilih.catatanTerakhir ? (
              <div className="relative overflow-hidden rounded-2xl border border-slate-200/80 bg-white p-6 shadow-xs">
                <blockquote className="relative">
                  <p className="text-sm sm:text-base leading-relaxed text-slate-800 italic">
                    &ldquo;{dipilih.catatanTerakhir.teks}&rdquo;
                  </p>
                  <footer className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500">
                    <div className="flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-100 font-semibold text-slate-700 text-[10px]">
                        {dipilih.catatanTerakhir.guru.slice(0, 2).toUpperCase()}
                      </div>
                      <span>
                        <b>{dipilih.catatanTerakhir.guru}</b> ·{" "}
                        {tanggalPendek(dipilih.catatanTerakhir.tanggal)}
                      </span>
                    </div>
                    {dipilih.pendaftaranId && (
                      <Link
                        href={`/enrollments/${dipilih.pendaftaranId}`}
                        className="font-medium text-brand hover:underline"
                      >
                        {tr("text112")}
                      </Link>
                    )}
                  </footer>
                </blockquote>
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 text-center shadow-xs">
                <Image
                  src="/svg/dashboard_orangtua/catatan.svg"
                  alt="Belum ada catatan"
                  width={120}
                  height={120}
                  className="mx-auto h-20 w-20 sm:h-24 sm:w-24 object-contain"
                />
                <h4 className="mt-3 text-sm font-bold text-slate-800">
                  {tr("noTeacherNotesTitle")}
                </h4>
                <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                  {tr("text125")}
                </p>
              </div>
            )}
          </section>

          {/* PERKEMBANGAN NILAI AKADEMIK (Minimalist Trend Chart) */}
          <section className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-slate-900">
                {tr("text120")}
              </h3>
              <div className="flex items-center gap-2">
                {rataNilai != null && (
                  <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">
                    {tr("dashOverall")}: <b>{rataNilai}</b>
                  </span>
                )}
                {pertumbuhan != null && (
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums ${
                      pertumbuhan >= 0
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-rose-50 text-rose-700"
                    }`}
                  >
                    {tr("dashGrowth")} {pertumbuhan >= 0 ? "+" : ""}
                    {pertumbuhan}
                  </span>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-xs">
              {dipilih.nilai.length >= 2 ? (
                <div className="pt-2">
                  <NilaiTrendChart data={dipilih.nilai} />
                </div>
              ) : dipilih.nilai.length === 1 ? (
                <div className="py-4 text-center">
                  <p className="text-3xl font-extrabold text-slate-900 tabular-nums">
                    {dipilih.nilai[0].nilai}
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    {tr("text121")} {tanggalPendek(dipilih.nilai[0].tanggal)} {tr("text122")}
                  </p>
                </div>
              ) : (
                <div className="py-8 text-center">
                  <Image
                    src="/svg/dashboard_orangtua/nilai.svg"
                    alt="Belum ada nilai"
                    width={120}
                    height={120}
                    className="mx-auto h-20 w-20 sm:h-24 sm:w-24 object-contain"
                  />
                  <h4 className="mt-3 text-sm font-bold text-slate-800">
                    {tr("noGradesHistoryTitle")}
                  </h4>
                  <p className="mt-1 text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    {tr("text123")}
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* KOLOM KANAN (~35%): Agenda Kelas, Presensi, Tagihan SPP                 */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-8">
          {/* JADWAL KELAS MINGGUAN (Timeline Minimalis) */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {tr("text109")}
              </h3>
              <Link
                href="/schedule"
                className="text-xs font-semibold text-brand hover:underline"
              >
                {tr("text108")}
              </Link>
            </div>

            {dipilih.jadwal.length === 0 ? (
              <div className="py-6 text-center">
                <Image
                  src="/svg/dashboard_orangtua/jadwal.svg"
                  alt="Belum ada jadwal"
                  width={120}
                  height={120}
                  className="mx-auto h-20 w-20 sm:h-24 sm:w-24 object-contain"
                />
                <h4 className="mt-3 text-sm font-bold text-slate-800">
                  {tr("noSessionScheduleTitle")}
                </h4>
                <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  {tr("text110")}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100">
                {dipilih.jadwal.map((j, i) => {
                  const sekarang = i === idxSekarang;
                  const berikut = i === idxBerikut && idxSekarang === -1;
                  return (
                    <li
                      key={`${j.hari}-${j.mulai}`}
                      className={`flex items-center justify-between py-3 transition-colors ${
                        sekarang
                          ? "rounded-xl bg-emerald-50/80 px-3 -mx-1"
                          : berikut
                            ? "rounded-xl bg-slate-50/80 px-3 -mx-1"
                            : ""
                      }`}
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-900">{j.hari}</span>
                          <span className="text-xs text-slate-400">•</span>
                          <span className="text-xs font-semibold text-slate-700">
                            {j.mulai}–{j.selesai}
                          </span>
                        </div>
                        <p className="truncate text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                          <span>{j.mapel} {j.guru ? `· ${j.guru}` : ""}</span>
                          {j.ruangan ? (
                            <span className="inline-flex items-center gap-0.5 rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-700 border border-blue-200/60">
                              🚪 {j.ruangan}
                            </span>
                          ) : null}
                        </p>
                      </div>

                      {sekarang ? (
                        <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                          {tr("dashJadwalSekarang")}
                        </span>
                      ) : berikut ? (
                        <span className="shrink-0 rounded-full border border-brand/40 bg-brand/5 px-2 py-0.5 text-[10px] font-bold text-brand">
                          {tr("dashJadwalBerikut")}
                        </span>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            )}

            {dipilih.pertemuanTerakhir && (
              <div className="border-t border-slate-100 pt-3 text-xs text-slate-500 flex items-center justify-between">
                <span>{tr("text111")}:</span>
                <span className="font-semibold text-slate-800">
                  {tanggalPendek(dipilih.pertemuanTerakhir.tanggal)} (
                  <span className="capitalize">{dipilih.pertemuanTerakhir.status}</span>)
                </span>
              </div>
            )}
          </section>

          {/* REKAP KEHADIRAN (Presensi Ring & Breakdown) */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {tr("text115")}
              </h3>
              <span className="text-xs font-semibold text-slate-500">
                {tr("meetingsCount", { count: dipilih.presensi.total })}
              </span>
            </div>

            {dipilih.presensi.total === 0 ? (
              <div className="py-6 text-center">
                <Image
                  src="/svg/dashboard_orangtua/presensi.svg"
                  alt="Belum ada presensi"
                  width={120}
                  height={120}
                  className="mx-auto h-20 w-20 sm:h-24 sm:w-24 object-contain"
                />
                <h4 className="mt-3 text-sm font-bold text-slate-800">
                  {tr("noAttendanceRecapTitle")}
                </h4>
                <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  {tr("text114")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-around gap-4 py-2">
                  <RingProgres
                    pct={dipilih.persenHadir ?? 0}
                    label={tr("attendanceLabel")}
                    tone={ringTone}
                    size={104}
                    variant="light"
                  />
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="rounded-xl bg-emerald-50 p-2 border border-emerald-100">
                      <p className="text-[10px] font-semibold text-emerald-600">
                        {tr("text116")}
                      </p>
                      <p className="text-base font-bold text-emerald-950 tabular-nums">
                        {dipilih.presensi.hadir}
                      </p>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-2 border border-amber-100">
                      <p className="text-[10px] font-semibold text-amber-600">
                        {tr("text117")}/{tr("text118")}
                      </p>
                      <p className="text-base font-bold text-amber-950 tabular-nums">
                        {dipilih.presensi.izin + dipilih.presensi.sakit}
                      </p>
                    </div>
                    <div className="col-span-2 rounded-xl bg-rose-50 p-2 border border-rose-100">
                      <p className="text-[10px] font-semibold text-rose-600">
                        {tr("text119")}
                      </p>
                      <p className="text-base font-bold text-rose-950 tabular-nums">
                        {dipilih.presensi.alpa}
                      </p>
                    </div>
                  </div>
                </div>

                <SegmentBar
                  parts={[
                    { label: tr("text116"), n: dipilih.presensi.hadir, className: "bg-emerald-500" },
                    { label: tr("text117"), n: dipilih.presensi.izin, className: "bg-amber-400" },
                    { label: tr("text118"), n: dipilih.presensi.sakit, className: "bg-amber-600" },
                    { label: tr("text119"), n: dipilih.presensi.alpa, className: "bg-rose-500" },
                  ]}
                />

                {dipilih.presensiRiwayat.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <GridKehadiran riwayat={dipilih.presensiRiwayat} />
                  </div>
                )}
              </div>
            )}
          </section>

          {/* STATUS SPP & TAGIHAN (Administrasi Ringkas) */}
          <section className="rounded-2xl border border-slate-200/80 bg-white p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">
                {tr("text038")}
              </h3>
              <Link
                href="/payments"
                className="text-xs font-semibold text-brand hover:underline"
              >
                {tr("text094")}
              </Link>
            </div>

            {t == null || (t.belumDibayar === 0 && t.sudahDibayar === 0) ? (
              <div className="py-6 text-center">
                <Image
                  src="/svg/dashboard_orangtua/payment.svg"
                  alt="Belum ada tagihan"
                  width={120}
                  height={120}
                  className="mx-auto h-20 w-20 sm:h-24 sm:w-24 object-contain"
                />
                <h4 className="mt-3 text-sm font-bold text-slate-800">
                  {tr("noOpenBillsTitle")}
                </h4>
                <p className="mt-1 text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  {tr("text096")}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <p className="text-xs font-medium text-slate-500">
                    {t.belumDibayar === 0 ? tr("text097") : tr("text098")}
                  </p>
                  <p className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums mt-0.5">
                    {rupiah(t.belumDibayar)}
                  </p>
                </div>

                {t.berikutnya && (
                  <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 space-y-1">
                    <div className="flex justify-between font-semibold text-slate-800">
                      <span>{t.berikutnya.label}</span>
                      <span>{rupiah(t.berikutnya.jumlah)}</span>
                    </div>
                    {t.berikutnya.jatuhTempo ? (
                      <p className="text-slate-500">
                        {tr("text099")} {tanggalPendek(t.berikutnya.jatuhTempo)}{" "}
                        {t.berikutnya.sisaHari != null && (
                          <span
                            className={
                              t.berikutnya.sisaHari < 0
                                ? "font-bold text-rose-600"
                                : t.berikutnya.sisaHari <= 7
                                  ? "font-bold text-amber-600"
                                  : "text-slate-600"
                            }
                          >
                            (
                            {t.berikutnya.sisaHari < 0
                              ? `lewat ${Math.abs(t.berikutnya.sisaHari)} hari`
                              : t.berikutnya.sisaHari === 0
                                ? tr("text100")
                                : `${t.berikutnya.sisaHari} hari lagi`}
                            )
                          </span>
                        )}
                      </p>
                    ) : null}
                  </div>
                )}

                {t.tenor ? (
                  <ProgressRow
                    label={tr("text103")}
                    value={`${t.tenor.lunas} dari ${t.tenor.total}`}
                    pct={(t.tenor.lunas / t.tenor.total) * 100}
                    tone={t.belumDibayar > 0 ? "amber" : "emerald"}
                    hint={tr("text104")}
                  />
                ) : (
                  <ProgressRow
                    label={tr("text105")}
                    value={t.belumDibayar === 0 ? "100%" : "menunggu"}
                    pct={
                      t.sudahDibayar + t.belumDibayar > 0
                        ? (t.sudahDibayar / (t.sudahDibayar + t.belumDibayar)) * 100
                        : 0
                    }
                    tone={t.belumDibayar === 0 ? "emerald" : "amber"}
                    hint={tr("text106")}
                  />
                )}

                {t.belumDibayar > 0 && dipilih.pendaftaranId ? (
                  <ButtonLink
                    href={`/enrollments/${dipilih.pendaftaranId}/pay`}
                    className="w-full justify-center"
                  >
                    {tr("text040")}
                  </ButtonLink>
                ) : (
                  <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <span>{tr("text097")}</span>
                  </div>
                )}
              </div>
            )}
          </section>
        </div>
      </div>
      )}
      </div>
    </div>
  );
}
