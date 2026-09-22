import { getTranslations, getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { ButtonLink } from "@/components/ui/button";
import { redirect } from "@/i18n/navigation";
import { ClearDraft } from "@/components/clear-draft";
import { dashboardOrangTua } from "@/lib/orang-tua-dashboard";
import { collect } from "@/lib/collect";
import { ChildrenBentoGrid } from "@/components/parent/children/children-bento-grid";
import type { ChildData } from "@/components/parent/children/types";
import { UserPlus, GraduationCap, Sparkles } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ChildrenPage() {
  const tr = await getTranslations("parent");
  const locale = await getLocale();
  const isEn = locale === "en";
  const session = await auth();
  if (!session?.user) {
    return redirect({ href: "/login?next=/children", locale });
  }
  const ortuId = Number(session.user.id);

  // Ambil data anak milik orang tua + data dashboard (termasuk kelas & jadwal)
  const [anakRows, dashboardList] = await Promise.all([
    collect(db.orm.public.Anak.where((a) => a.orangTuaId.eq(ortuId)).all()),
    dashboardOrangTua(ortuId, isEn ? "en" : "id"),
  ]);

  const dashMap = new Map(dashboardList.map((d) => [d.id, d]));

  // Hitung jumlah pendaftaran aktif per anak untuk status lock
  const aktifPerAnak = await Promise.all(
    anakRows.map(async (a) => {
      const rows = await collect(
        db.orm.public.Pendaftaran.where((p) => p.anakId.eq(a.id)).all(),
      );
      const aktif = rows.filter((p) =>
        ["menunggu_pembayaran", "terdaftar", "tertunggak"].includes(p.status),
      );
      return [a.id, aktif.length] as const;
    }),
  );
  const aktifMap = new Map(aktifPerAnak);

  // Bentuk array data ChildData untuk Bento Card & Quick View Modal
  const childrenList: ChildData[] = anakRows.map((a) => {
    const dash = dashMap.get(a.id);
    const nAktif = aktifMap.get(a.id) ?? 0;
    return {
      id: a.id,
      nama: a.nama,
      tanggalLahir: a.tanggalLahir,
      jenjangTerakhir: a.jenjangTerakhir,
      tingkat: a.tingkat,
      emailNotifikasi: a.emailNotifikasi,
      nomorTelepon: a.nomorTelepon,
      persetujuanFoto: a.persetujuanFoto,
      jumlahKelasAktif: nAktif,
      isLocked: nAktif > 0,
      kelasAktif: dash?.kelas ?? null,
      jadwal: dash?.jadwal ?? [],
      presensi: dash?.presensi ?? undefined,
      persenHadir: dash?.persenHadir ?? null,
    };
  });

  return (
    <div className="min-h-full bg-slate-50/50 pb-20">
      <ClearDraft storageKey={["siedu_draft_child_info", "siedu_draft_child_edit_*"]} />

      {/* 1. HERO HEADER (Konsisten dengan Halaman Katalog & Home Orang Tua) */}
      <section className="relative overflow-hidden bg-[#1d4ed8] text-white pt-8 pb-16 sm:pt-10 sm:pb-20 shadow-xs border-b border-blue-900/20">
        {/* Gelombang sudut tanpa gradient khas Siedu */}
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

        <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-blue-100 backdrop-blur-xs mb-2 border border-white/15">
                <Sparkles className="size-3.5 text-amber-300" />
                <span>{childrenList.length} {isEn ? "Registered Children" : "Anak Terdaftar"}</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white sm:text-3xl lg:text-4xl">
                {tr("text006")}
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-blue-100/90 font-medium max-w-xl">
                {tr("text007")}
              </p>
            </div>

            <ButtonLink
              href="/children/new"
              size="sm"
              className="bg-white text-brand hover:bg-blue-50 font-bold border-transparent shadow-xs transition-colors shrink-0"
            >
              <UserPlus className="size-3.5" />
              {tr("text008")}
            </ButtonLink>
          </div>
        </div>
      </section>

      {/* 2. DAFTAR KARTU BENTO ANAK / EMPTY STATE (Overlap ke Hero) */}
      <div className="relative z-10 mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-8 space-y-6">
        {childrenList.length === 0 ? (
          <div className="rounded-2xl sm:rounded-3xl border border-slate-200/90 bg-white p-8 sm:p-12 text-center shadow-sm max-w-2xl mx-auto space-y-5">
            <div className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-blue-50 text-brand border border-blue-100 shadow-2xs">
              <GraduationCap className="size-8" />
            </div>
            <div className="space-y-1.5">
              <h3 className="text-lg font-bold text-slate-900">
                {tr("text009")}
              </h3>
              <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto leading-relaxed">
                {isEn
                  ? "Add your children's profiles first to easily enroll them in Siedu tutoring classes and monitor their daily learning progress."
                  : "Daftarkan profil putra-putri Anda terlebih dahulu untuk memudahkan proses pendaftaran kelas bimbingan belajar dan pemantauan belajar harian."}
              </p>
            </div>
            <div className="pt-2">
              <ButtonLink
                href="/children/new"
                className="bg-brand text-white hover:bg-brand-dark font-bold shadow-xs px-5 py-2.5 inline-flex items-center gap-2 rounded-xl transition-all active:scale-[0.98]"
              >
                <UserPlus className="size-4" />
                {tr("text010")}
              </ButtonLink>
            </div>
          </div>
        ) : (
          <ChildrenBentoGrid childrenList={childrenList} />
        )}
      </div>
    </div>
  );
}
