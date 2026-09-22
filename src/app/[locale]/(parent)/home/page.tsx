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
import { SITE } from "@/lib/site";
import {
  Calendar,
  Clock,
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
  locale,
}: {
  userName: string | null;
  locale: string;
}) {
  const isEn = locale === "en";
  const waHref = `https://wa.me/${SITE.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(
    isEn
      ? "Hello Siedu Admin, I would like to ask about tutoring programs."
      : "Halo Admin Siedu, saya ingin bertanya tentang program bimbingan belajar."
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
            {isEn ? `Welcome, ${userName ?? "Parent"}!` : `Selamat Datang, ${userName ?? "Bapak/Ibu Orang Tua"}!`}
          </h1>
          <p className="mt-2.5 max-w-2xl text-xs sm:text-sm lg:text-base text-blue-100/90 leading-relaxed font-medium">
            {isEn
              ? "Your centralized dashboard to monitor face-to-face sessions, real-time attendance, teacher notes, homework progress, and tuition payments for your children."
              : "Portal terpadu untuk memantau sesi belajar tatap muka, presensi kehadiran real-time, catatan guru, hasil tugas harian, dan pembayaran bimbel putra-putri Anda."}
          </p>
        </div>
      </section>

      {/* 2. Konten Onboarding melayang ke hero */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-12 space-y-8">
        {/* Card Utama: 3 Langkah Memulai */}
        <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-6 sm:p-8 lg:p-10 shadow-sm space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                {isEn ? "Quick Start Guide" : "Panduan Langkah Awal"}
              </span>
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 mt-0.5 tracking-tight">
                {isEn ? "3 Easy Steps to Start Learning at Siedu" : "3 Langkah Mudah Memulai Belajar di Siedu"}
              </h2>
            </div>
            <Link
              href="/children/new"
              className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-bold text-white shadow-xs transition-all active:scale-[0.98] hover:brightness-95 shrink-0 cursor-pointer"
              style={{ backgroundColor: "#f26d0f" }}
            >
              <UserPlus className="size-4" />
              {isEn ? "Add Child Profile" : "Tambah Profil Anak"}
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
                    {isEn ? "Step 1 (Now)" : "Langkah 1 (Sekarang)"}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {isEn ? "Create Child Profile" : "Buat Profil Anak"}
                </h3>
                <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                  {isEn
                    ? "Enter your child's name, school level (Kindergarten, Elementary, Junior High, or Senior High), and birth date."
                    : "Masukkan data putra/putri Anda: nama lengkap, jenjang sekolah (TK, SD, SMP, atau SMA), dan tanggal lahir."}
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-blue-100">
                <Link
                  href="/children/new"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 group cursor-pointer"
                >
                  <span>{isEn ? "Create profile now" : "Daftarkan profil sekarang"}</span>
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
                    {isEn ? "Step 2" : "Langkah 2"}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {isEn ? "Choose Tutoring Class" : "Pilih Kelas Bimbel"}
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                  {isEn
                    ? "Browse the catalog for subjects, teacher profiles, and weekly schedules that best fit your child."
                    : "Pilih mata pelajaran, jadwal sesi belajar mingguan, dan pengajar yang paling pas dengan jadwal sekolah anak."}
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-200/60">
                <Link
                  href="/classes"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 group cursor-pointer"
                >
                  <span>{isEn ? "Explore catalog" : "Lihat katalog kelas"}</span>
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
                    {isEn ? "Step 3" : "Langkah 3"}
                  </span>
                </div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  {isEn ? "Monitor Progress" : "Pantau Perkembangan"}
                </h3>
                <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                  {isEn
                    ? "Track live attendance, teacher documentation, and academic test scores directly on this portal."
                    : "Dapatkan modul cetak, pantau kehadiran saat sesi tatap muka, dan evaluasi hasil belajar berkala langsung di sini."}
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-200/60">
                <span className="text-xs text-slate-400 font-medium">
                  {isEn ? "Active once enrolled" : "Aktif setelah terdaftar"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Highlight Fitur Utama Dashboard */}
        <div>
          <div className="text-center max-w-xl mx-auto mb-6">
            <h3 className="text-base sm:text-lg font-bold text-slate-900">
              {isEn ? "What You Can Monitor in This Portal" : "Apa Saja yang Bisa Dipantau Orang Tua?"}
            </h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {isEn
                ? "Designed to keep you closely connected with your child's learning journey."
                : "Dirancang agar orang tua selalu terhubung dengan kegiatan dan kemajuan belajar anak setiap hari."}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                <Camera className="size-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                {isEn ? "Session Stories & Photos" : "Jurnal & Dokumentasi Sesi"}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isEn
                  ? "Visual updates and learning summary photos shared by teachers after each tutoring session."
                  : "Dokumentasi foto kegiatan belajar dan rangkuman materi dari tutor yang dapat dilihat layaknya status story."}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <Calendar className="size-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                {isEn ? "Real-Time Attendance" : "Rekap Presensi & Jadwal"}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isEn
                  ? "Transparent check-in records for every face-to-face class along with automated upcoming schedule reminders."
                  : "Catatan kehadiran murid saat sesi tatap muka secara transparan disertai jadwal sesi les mingguan."}
              </p>
            </div>

            <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs space-y-3">
              <div className="flex size-10 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
                <Quote className="size-5" />
              </div>
              <h4 className="text-sm font-bold text-slate-900">
                {isEn ? "Teacher Notes & Grades" : "Catatan Guru & Evaluasi Nilai"}
              </h4>
              <p className="text-xs text-slate-500 leading-relaxed">
                {isEn
                  ? "Personalized feedback from tutors, homework evaluation, and test score progress trends."
                  : "Pesan dan saran personal dari tutor pembimbing serta grafik perkembangan nilai tugas harian dan tryout."}
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
                {isEn ? "Need help choosing the right program?" : "Butuh bantuan memilih kelas yang sesuai?"}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                {isEn
                  ? "Our education counselors are ready to help you find the best learning path for your child."
                  : "Tim konselor Siedu siap membantu konsultasi kurikulum dan jadwal bimbingan belajar terbaik."}
              </p>
            </div>
          </div>
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs shrink-0 cursor-pointer"
          >
            {isEn ? "Consult via WhatsApp" : "Konsultasi via WhatsApp"}
          </a>
        </div>
      </div>
    </div>
  );
}

function BelumDaftarKelasState({
  anak,
  locale,
}: {
  anak: AnakDashboard;
  locale: string;
}) {
  const isEn = locale === "en";
  const catalogUrl = anak.jenjang
    ? `/classes?jenjang=${encodeURIComponent(anak.jenjang)}`
    : "/classes";

  return (
    <div className="space-y-8">
      {/* Banner Langkah Selanjutnya */}
      <div className="rounded-2xl sm:rounded-3xl border border-blue-200/80 bg-gradient-to-br from-blue-50/90 via-white to-indigo-50/50 p-6 sm:p-8 lg:p-10 shadow-xs relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="max-w-2xl space-y-3.5">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-100/90 border border-blue-200 px-3 py-1 text-xs font-bold text-blue-800">
              <CheckCircle2 className="size-3.5 text-blue-600" />
              {isEn ? "Child Profile Created" : "Profil Siswa Berhasil Dibuat"}
            </div>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-slate-900 tracking-tight leading-snug">
              {isEn
                ? `Next Step: Choose a Class for ${anak.nama}`
                : `Langkah Selanjutnya: Pilih Kelas Bimbel untuk ${anak.nama}`}
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
              {isEn
                ? `Enroll ${anak.nama} into a tutoring class matching their school level (${anak.jenjang || "General"}) to secure seat quota, receive weekly face-to-face schedules, and obtain study modules.`
                : `Daftarkan ${anak.nama} ke kelas bimbingan belajar sesuai jenjangnya (${anak.jenjang || "Umum"}) untuk mengamankan kuota kursi, mendapatkan jadwal sesi tatap muka ber-AC, dan modul materi cetak.`}
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href={catalogUrl}
                className="inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-xs sm:text-sm font-bold text-white shadow-xs transition-all active:scale-[0.98] hover:brightness-95 cursor-pointer"
                style={{ backgroundColor: "#f26d0f" }}
              >
                <BookOpen className="size-4" />
                {isEn
                  ? `Choose Class for ${anak.nama}`
                  : `Pilih Kelas untuk ${anak.nama}`}
              </Link>
              <Link
                href="/classes"
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                {isEn ? "Explore All Programs" : "Lihat Semua Program"}
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
                  Jenjang: {anak.jenjang || "Belum diatur"}
                </span>
              </div>
            </div>
            <div className="text-xs text-slate-500 border-t border-slate-100 pt-3 space-y-2">
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="size-3.5 text-emerald-600 shrink-0" />
                <span>Modul cetak & bank soal</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="size-3.5 text-emerald-600 shrink-0" />
                <span>Kelas tatap muka ruang AC</span>
              </div>
              <div className="flex items-center gap-2 text-slate-700">
                <Check className="size-3.5 text-emerald-600 shrink-0" />
                <span>Bimbingan PR & konsultasi</span>
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
            {isEn ? "Select Subject & Schedule" : "Pilih Mata Pelajaran & Jadwal"}
          </h4>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            {isEn
              ? "Choose the learning program and weekly schedule that best fits your family routine."
              : "Tentukan mata pelajaran yang ingin dipelajari dan hari sesi belajar yang sesuai."}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <span className="flex size-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 mb-3">
            2
          </span>
          <h4 className="font-bold text-sm text-slate-900">
            {isEn ? "Flexible Payment" : "Metode Bayar Fleksibel"}
          </h4>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            {isEn
              ? "Pay in full or start with a down payment and easy monthly installments."
              : "Pilih opsi bayar penuh atau DP ringan dengan cicilan terjangkau tiap bulan."}
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200/80 bg-white p-5 shadow-2xs">
          <span className="flex size-7 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700 mb-3">
            3
          </span>
          <h4 className="font-bold text-sm text-slate-900">
            {isEn ? "Start Learning & Track" : "Mulai Belajar & Pantau"}
          </h4>
          <p className="mt-1 text-xs text-slate-500 leading-relaxed">
            {isEn
              ? "Once enrolled, live attendance, grades, and teacher notes activate automatically here."
              : "Setelah terdaftar, dashboard ini otomatis menampilkan rekap jadwal, presensi, dan nilai."}
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
        locale={locale}
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
          {/* Baris Konteks & Salam Orang Tua */}
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs sm:text-sm text-blue-100/90 font-medium mb-4 pb-3 border-b border-blue-400/20">
            <div className="flex items-center gap-2 flex-wrap">
              <span>
                {tr("text078")} <b>{session.user.name ?? tr("text079")}</b>
              </span>
              <span className="text-blue-300">•</span>
              <span>
                {anakList.length} {tr("text083")}
              </span>
            </div>
            {anakList.filter((a) => (a.tagihan?.belumDibayar ?? 0) > 0).length > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-md bg-rose-500/20 border border-rose-400/30 px-2 py-0.5 text-xs font-semibold text-rose-200">
                {anakList.filter((a) => (a.tagihan?.belumDibayar ?? 0) > 0).length}{" "}
                {tr("text084")}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/20 border border-emerald-400/30 px-2 py-0.5 text-xs font-semibold text-emerald-200">
                <Check className="size-3" />
                {tr("text085")}
              </span>
            )}
          </div>

          {/* Blok Utama: Identitas Anak Aktif & Aksi Cepat */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            {/* Sisi Kiri: Avatar + Nama Anak + Detail Kelas + Status Pendaftaran */}
            <div className="flex items-start sm:items-center gap-4 min-w-0">
              <div className="flex size-14 sm:size-16 items-center justify-center rounded-2xl bg-white/15 text-white font-black text-xl sm:text-2xl border border-white/25 backdrop-blur-xs shadow-xs shrink-0">
                {dipilih.nama.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight truncate">
                    {dipilih.nama}
                  </h1>
                  <div>
                    {dipilih.status ? (
                      <StatusBadge status={dipilih.status as StatusPendaftaran} />
                    ) : (
                      <span className="inline-flex items-center rounded-full bg-blue-100 text-blue-800 border border-blue-200 px-3 py-1 text-xs font-medium">
                        {tr("text088")}
                      </span>
                    )}
                  </div>
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
                </div>
              </div>
            </div>

            {/* Sisi Kanan: Switcher & Tombol Aksi */}
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              {/* Dropdown Switcher Anak (Jika anak > 1) */}
              {anakList.length > 1 && (
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
              )}

              {/* Tombol Kelola Akun Anak */}
              <ButtonLink
                href="/children"
                size="sm"
                className="bg-white text-brand hover:bg-blue-50 font-bold border-transparent shadow-xs transition-colors inline-flex items-center gap-1.5"
              >
                <Users className="size-3.5" />
                <span>Kelola Akun Anak</span>
              </ButtonLink>

              {/* Tombol Detail Pendaftaran / Pilih Kelas */}
              {dipilih.pendaftaranId ? (
                <ButtonLink
                  href={`/enrollments/${dipilih.pendaftaranId}`}
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xs font-semibold transition-colors"
                >
                  {tr("dashActionDetail")}
                </ButtonLink>
              ) : (
                <ButtonLink
                  href={`/classes?jenjang=${dipilih.jenjang ?? ""}`}
                  size="sm"
                  className="bg-white/10 hover:bg-white/20 text-white border border-white/20 backdrop-blur-xs font-semibold transition-colors inline-flex items-center gap-1.5"
                >
                  <BookOpen className="size-3.5" />
                  <span>Pilih Kelas</span>
                </ButtonLink>
              )}
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
        <BelumDaftarKelasState anak={dipilih} locale={locale} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
        {/* ----------------------------------------------------------------------- */}
        {/* KOLOM KIRI (~65%): Jurnal Belajar, Story WA/IG, Catatan Guru, Nilai     */}
        {/* ----------------------------------------------------------------------- */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-8">

          {/* DOKUMENTASI & STATUS PEMBELAJARAN (WhatsApp/Instagram Status Inline) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
                {tr("learningStatusFeedTitle")}
              </h3>
              {learningStatuses.length > 0 && (
                <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-700">
                  {learningStatuses.length} Update Terbaru
                </span>
              )}
            </div>

            {/* WA/IG Inline Story Component (No Modal Popups) */}
            <LearningStatusInlineStory statuses={learningStatuses} />
          </section>

          {/* CATATAN PERKEMBANGAN GURU (Editorial Quote) */}
          <section className="space-y-3 pt-2">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
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
                  Belum Ada Catatan Guru
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
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900">
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
                    Belum Ada Riwayat Nilai
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
                  Belum Ada Jadwal Sesi
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
                        <p className="truncate text-xs text-slate-500 mt-0.5">
                          {j.mapel} {j.guru ? `· ${j.guru}` : ""}
                        </p>
                      </div>

                      {sekarang ? (
                        <span className="shrink-0 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                          {tr("dashJadwalSekarang")}
                        </span>
                      ) : berikut ? (
                        <span className="shrink-0 rounded-full border border-brand/40 bg-brand/5 px-2 py-0.5 text-[10px] font-bold text-brand uppercase tracking-wider">
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
                {dipilih.presensi.total} Pertemuan
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
                  Belum Ada Rekap Presensi
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
                    label="Kehadiran"
                    tone={ringTone}
                    size={104}
                    variant="light"
                  />
                  <div className="grid grid-cols-2 gap-2 text-center text-xs">
                    <div className="rounded-xl bg-emerald-50 p-2 border border-emerald-100">
                      <p className="text-[10px] uppercase font-semibold text-emerald-600">
                        {tr("text116")}
                      </p>
                      <p className="text-base font-bold text-emerald-950 tabular-nums">
                        {dipilih.presensi.hadir}
                      </p>
                    </div>
                    <div className="rounded-xl bg-amber-50 p-2 border border-amber-100">
                      <p className="text-[10px] uppercase font-semibold text-amber-600">
                        {tr("text117")}/{tr("text118")}
                      </p>
                      <p className="text-base font-bold text-amber-950 tabular-nums">
                        {dipilih.presensi.izin + dipilih.presensi.sakit}
                      </p>
                    </div>
                    <div className="col-span-2 rounded-xl bg-rose-50 p-2 border border-rose-100">
                      <p className="text-[10px] uppercase font-semibold text-rose-600">
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
                  Tidak Ada Tagihan Terbuka
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
