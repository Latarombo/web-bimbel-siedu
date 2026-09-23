"use client";

import { useTranslations } from "next-intl";
import {
  MapPin,
  Calendar,
  Clock,
  User,
  GraduationCap,
  Sparkles,
  Printer,
  MessageCircle,
  ExternalLink,
  DoorOpen,
  CheckCircle2,
  BookOpen,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { SITE, MAPS_SEARCH_URL } from "@/lib/site";

export interface ClassTicketProps {
  enrollmentId: number;
  childName: string;
  subjectName: string;
  grade: string;
  teacherName: string;
  ruangan?: string | null;
  jadwal: { hari: string; mulai: string; selesai: string }[];
  firstSessionDate?: string | null;
  branchAddress?: readonly string[];
  mapsUrl?: string;
  whatsappNumber?: string;
  className?: string;
}

export function ClassTicket({
  enrollmentId,
  childName,
  subjectName,
  grade,
  teacherName,
  ruangan,
  jadwal,
  firstSessionDate,
  branchAddress = SITE.alamat,
  mapsUrl = MAPS_SEARCH_URL,
  whatsappNumber = SITE.whatsapp,
  className = "",
}: ClassTicketProps) {
  const tr = useTranslations("parent");

  const formattedRegNumber = `SIEDU-${String(enrollmentId).padStart(5, "0")}`;

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  const waHref = `https://wa.me/${whatsappNumber.replace(/\D/g, "")}?text=${encodeURIComponent(
    `Halo Admin Siedu, saya orang tua dari ${childName} (No. Registrasi: ${formattedRegNumber}). Ingin konfirmasi mengenai ruang kelas dan persiapan sesi pertama ${subjectName}.`,
  )}`;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 1. TIKET MASUK KELAS (Admission Pass Style) */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-blue-200 bg-white shadow-md print:shadow-none print:border-slate-400">
        {/* Top Header Banner Tiket */}
        <div className="relative bg-blue-700 px-6 py-5 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex size-9 items-center justify-center rounded-xl bg-white/15 backdrop-blur-xs">
                <Sparkles className="size-5 text-amber-300" />
              </span>
              <div>
                <span className="text-xs font-medium text-blue-100">
                  {tr("ticketTitle")}
                </span>
                <h2 className="text-lg font-black tracking-tight text-white sm:text-xl">
                  {subjectName}
                </h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-300/40 px-3 py-1 text-xs font-bold text-emerald-200 backdrop-blur-xs">
                <ShieldCheck className="size-3.5" />
                {tr("ticketBadgeActive")}
              </span>
              <span className="hidden sm:inline-block rounded-xl bg-white/10 px-3 py-1 font-mono text-xs font-bold tracking-wider text-white">
                {formattedRegNumber}
              </span>
            </div>
          </div>
        </div>

        {/* Isi Tiket (Grid 2 Kolom) */}
        <div className="p-6 sm:p-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-8">
            {/* Kolom Kiri: Siswa & Pengajar */}
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <span className="text-xs font-semibold text-slate-600">
                  {tr("ticketStudentLabel")}
                </span>
                <p className="mt-1 text-base font-bold text-slate-900 sm:text-lg">
                  {childName}
                </p>
                <div className="mt-1 flex items-center gap-2 text-xs font-medium text-slate-600">
                  <GraduationCap className="size-3.5 text-blue-600" />
                  <span>Jenjang {grade}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <span className="text-xs font-semibold text-slate-600">
                  {tr("ticketTeacherLabel")}
                </span>
                <div className="mt-1 flex items-center gap-2">
                  <User className="size-4 text-blue-600" />
                  <p className="font-semibold text-slate-900">{teacherName}</p>
                </div>
              </div>

              {/* Jadwal Pertemuan */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <span className="text-xs font-semibold text-slate-600">
                  {tr("ticketScheduleLabel")}
                </span>
                <div className="mt-2 space-y-1.5">
                  {jadwal.length > 0 ? (
                    jadwal.map((j, i) => (
                      <div
                        key={i}
                        className="flex items-center justify-between text-xs font-medium text-slate-800"
                      >
                        <span className="font-semibold text-blue-700">
                          {j.hari}
                        </span>
                        <span className="tabular-nums text-slate-600">
                          {j.mulai.slice(0, 5)} - {j.selesai.slice(0, 5)} WIB
                        </span>
                      </div>
                    ))
                  ) : (
                    <p className="text-xs text-slate-500">-</p>
                  )}
                </div>
              </div>
            </div>

            {/* Kolom Kanan: LOKASI & RUANG KELAS (Fokus Utama Pertanyaan User) */}
            <div className="space-y-4 flex flex-col justify-between">
              {/* Highlight Ruang Kelas */}
              <div className="rounded-2xl border-2 border-blue-500/30 bg-blue-50/50 p-5 shadow-xs">
                <div className="flex items-center gap-2 text-blue-800">
                  <DoorOpen className="size-5 text-blue-600" />
                  <span className="text-xs font-semibold">
                    {tr("ticketRoomLabel")}
                  </span>
                </div>
                <p className="mt-2 text-lg font-black text-blue-950 sm:text-xl">
                  {ruangan && ruangan.trim() !== ""
                    ? ruangan
                    : tr("ticketRoomTbd")}
                </p>
                <p className="mt-1 text-xs text-blue-700/80">
                  Lantai & penunjuk arah ruangan tersedia di meja lobi depan.
                </p>
              </div>

              {/* Lokasi Gedung Cabang */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-4">
                <div className="flex items-center gap-2 text-slate-700">
                  <MapPin className="size-4 text-rose-500" />
                  <span className="text-xs font-semibold">
                    {tr("ticketLocationLabel")}
                  </span>
                </div>
                <div className="mt-2 text-xs leading-relaxed text-slate-600">
                  {branchAddress.map((baris, idx) => (
                    <p key={idx}>{baris}</p>
                  ))}
                </div>

                <div className="mt-3 flex flex-wrap gap-2 pt-1">
                  <a
                    href={mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-2xs transition-colors hover:bg-blue-700"
                  >
                    <MapPin className="size-3" />
                    <span>{tr("ticketMapsButton")}</span>
                    <ExternalLink className="size-2.5 opacity-80" />
                  </a>
                </div>
              </div>

              {/* Sesi Perdana (jika ada) */}
              {firstSessionDate && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                  <div className="flex items-center gap-2 text-emerald-800">
                    <Calendar className="size-4 text-emerald-600" />
                    <span className="text-xs font-bold">
                      {tr("ticketFirstSessionLabel")}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-bold text-emerald-950">
                    {firstSessionDate}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Footer Tiket: Cetak & WhatsApp */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-5 print:hidden">
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span>{tr("ticketEnrollmentNumber")}:</span>
              <strong className="text-slate-900">{formattedRegNumber}</strong>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 hover:text-slate-900"
              >
                <Printer className="size-3.5 text-slate-500" />
                <span>{tr("ticketPrintButton")}</span>
              </button>

              <a
                href={waHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-bold text-white shadow-xs transition-colors hover:bg-emerald-700"
              >
                <MessageCircle className="size-3.5" />
                <span>{tr("ticketWhatsappContact")}</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* 2. PANDUAN HARI PERTAMA BELAJAR (Checklist Onboarding Referensi GO, Kumon, Brain Academy) */}
      <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs">
        <div className="flex items-center gap-2.5 mb-2">
          <span className="flex size-8 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
            <CheckCircle2 className="size-4.5" />
          </span>
          <h3 className="text-base font-bold text-slate-900 sm:text-lg">
            {tr("ticketChecklistTitle")}
          </h3>
        </div>
        <p className="text-xs text-slate-600 sm:text-sm max-w-2xl mb-6">
          {tr("ticketChecklistSubtitle")}
        </p>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {/* Langkah 1 */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition-all hover:bg-white hover:border-blue-200 hover:shadow-xs">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-xs mb-3">
              1
            </div>
            <h4 className="text-xs font-bold text-slate-900">
              {tr("ticketStep1Title")}
            </h4>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
              {tr("ticketStep1Desc")}
            </p>
          </div>

          {/* Langkah 2 */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition-all hover:bg-white hover:border-blue-200 hover:shadow-xs">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-xs mb-3">
              2
            </div>
            <h4 className="text-xs font-bold text-slate-900">
              {tr("ticketStep2Title")}
            </h4>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
              {tr("ticketStep2Desc")}
            </p>
          </div>

          {/* Langkah 3 */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition-all hover:bg-white hover:border-blue-200 hover:shadow-xs">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-xs mb-3">
              3
            </div>
            <h4 className="text-xs font-bold text-slate-900">
              {tr("ticketStep3Title")}
            </h4>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
              {tr("ticketStep3Desc")}
            </p>
          </div>

          {/* Langkah 4 */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50/60 p-4 transition-all hover:bg-white hover:border-blue-200 hover:shadow-xs">
            <div className="flex size-7 items-center justify-center rounded-lg bg-blue-100 text-blue-700 font-bold text-xs mb-3">
              4
            </div>
            <h4 className="text-xs font-bold text-slate-900">
              {tr("ticketStep4Title")}
            </h4>
            <p className="mt-1.5 text-[11px] leading-relaxed text-slate-600">
              {tr("ticketStep4Desc")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
