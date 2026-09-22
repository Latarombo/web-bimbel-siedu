import { labelHari } from "@/lib/label";
import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { ArrowLeft } from "lucide-react";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import DaftarForm from "@/components/pendaftaran/daftar-form";

export const dynamic = "force-dynamic";

export default async function DaftarKelasPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const tr = await getTranslations("public");
  const locale = (await getLocale()) === "en" ? "en" : "id";
  const { id } = await params;
  const sp = await searchParams;
  const kelasId = Number(id);
  if (!Number.isInteger(kelasId)) notFound();

  const anakIdAwal = typeof sp.anakId === "string" ? sp.anakId : Array.isArray(sp.anakId) ? sp.anakId[0] : undefined;
  const metodeAwal = sp.metode === "dp_cicilan" ? "dp_cicilan" : "lunas";
  const tenorDipilih = Number(sp.tenor);

  const currentPath = `/classes/${kelasId}/daftar${sp.metode ? `?metode=${sp.metode}&tenor=${sp.tenor}` : ""}${anakIdAwal ? `&anakId=${anakIdAwal}` : ""}`;
  const session = await auth();
  if (!session?.user) return redirect({ href: `/login?next=${encodeURIComponent(currentPath)}`, locale });
  if (session.user.role !== "orang_tua") return redirect({ href: "/classes", locale });

  const ortuId = Number(session.user.id);

  const [anak, targetList] = await Promise.all([
    collect(db.orm.public.Anak.where((a) => a.orangTuaId.eq(ortuId)).all()),
    collect(
      db.orm.public.Kelas.where((k) => k.id.eq(kelasId))
        .where((k) => k.status.eq("aktif"))
        .include("mataPelajaran", (b) => b.select("id", "nama", "deskripsi"))
        .include("guru", (b) => b.select("id", "name"))
        .include("periode", (b) => b.select("id", "nama", "status", "tanggalMulai", "tanggalSelesai"))
        .include("jadwalItem", (b) => b.select("id", "hari", "jamMulai", "jamSelesai").orderBy((j) => j.hari.asc()))
        .all(),
    ),
  ]);

  const target = targetList[0];
  if (!target) notFound();

  const jadwalItems = (target.jadwalItem ?? []).map((j) => ({
    hari: labelHari(j.hari, locale),
    jam: `${String(j.jamMulai).slice(0, 5)} - ${String(j.jamSelesai).slice(0, 5)} WIB`,
  }));

  const jadwal = (target.jadwalItem ?? [])
    .map((j) => `${labelHari(j.hari, locale)} ${String(j.jamMulai).slice(0, 5)}-${String(j.jamSelesai).slice(0, 5)}`)
    .join(", ");

  const targetTingkat = ((target as unknown as { tingkat?: string | null }).tingkat) ?? null;
  const namaTingkat = targetTingkat
    ? (targetTingkat.toLowerCase().startsWith("kelas") ? targetTingkat : `Kelas ${targetTingkat}`)
    : "Kelas";
  const judulKelas = `${target.mataPelajaran.nama} - ${target.jenjang} - ${namaTingkat}`;

  return (
    <div className="min-h-full bg-slate-50 pb-20">
      {/* Header Kelas: Gradien Brand Siedu dengan Aksen Gelombang Organik */}
      <section className="relative overflow-hidden bg-gradient-to-r from-[#1e40af] via-[#1d4ed8] to-[#2563eb] pt-6 pb-16 sm:pt-8 sm:pb-20 lg:pt-10 lg:pb-24 text-white border-b border-blue-900/20 shadow-xs">
        {/* Vektor kurva gelombang organik berlapis (clean & elegan di tepi sudut) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          {/* Gelombang sudut kanan atas */}
          <svg
            className="absolute -right-8 -top-8 w-72 sm:w-96 md:w-[480px] h-auto text-white"
            viewBox="0 0 400 280"
            fill="none"
          >
            <path
              d="M120 0 C200 45, 290 110, 400 240 L400 0 Z"
              fill="currentColor"
              fillOpacity="0.05"
            />
            <path
              d="M190 0 C260 40, 330 95, 400 180 L400 0 Z"
              fill="currentColor"
              fillOpacity="0.07"
            />
            <path
              d="M270 0 C325 30, 365 65, 400 120 L400 0 Z"
              fill="currentColor"
              fillOpacity="0.09"
            />
          </svg>

          {/* Gelombang sudut kiri bawah */}
          <svg
            className="absolute -left-8 -bottom-8 w-64 sm:w-80 md:w-[420px] h-auto text-white"
            viewBox="0 0 360 260"
            fill="none"
          >
            <path
              d="M0 60 C90 105, 180 175, 280 260 L0 260 Z"
              fill="currentColor"
              fillOpacity="0.05"
            />
            <path
              d="M0 120 C75 155, 145 205, 210 260 L0 260 Z"
              fill="currentColor"
              fillOpacity="0.07"
            />
            <path
              d="M0 180 C50 205, 100 230, 140 260 L0 260 Z"
              fill="currentColor"
              fillOpacity="0.08"
            />
          </svg>
        </div>

        <div className="relative mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Bar Atas: Tombol Bulat Putih di Kiri & Judul Kelas di Tengah */}
          <div className="relative flex items-center justify-center min-h-11 sm:min-h-12">
            <Link
              href={`/classes/${kelasId}`}
              className="absolute left-0 grid size-9 sm:size-10 place-items-center rounded-full bg-white text-slate-800 hover:bg-slate-50 shadow-sm transition-transform active:scale-95 z-10 shrink-0"
              aria-label="Kembali ke detail kelas"
            >
              <ArrowLeft className="size-4 sm:size-5" aria-hidden />
            </Link>

            <div className="text-center px-10 sm:px-14 max-w-2xl mx-auto">
              <h1 className="text-base sm:text-lg lg:text-xl font-bold text-white tracking-tight leading-snug">
                Draft Invoice
              </h1>
              <p className="mt-0.5 text-xs sm:text-sm font-medium text-white/85 truncate">
                {judulKelas}
                {target.periode?.nama ? (
                  <>
                    <span className="font-normal text-white/60 mx-1.5">•</span>
                    <span>{target.periode.nama}</span>
                  </>
                ) : null}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Konten Utama: 2 Kolom Layout, Melayang Masuk ke Hero */}
      <div className="relative z-10 mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-12 lg:-mt-14 pb-20 lg:pb-16">
        <DaftarForm
          kelasId={target.id}
          mapelNama={target.mataPelajaran.nama}
          jadwal={jadwal}
          jadwalItems={jadwalItems}
          jenjang={target.jenjang}
          tingkat={targetTingkat}
          periodeNama={target.periode?.nama ?? ""}
          tanggalSelesai={target.periode?.tanggalSelesai ? String(target.periode.tanggalSelesai) : null}
          biayaPeriode={Number(target.biayaPeriode)}
          biayaDp={target.biayaDp == null ? null : Number(target.biayaDp)}
          tenorMaksimum={target.tenorMaksimum}
          metodeAwal={metodeAwal}
          tenorAwal={Number.isFinite(tenorDipilih) ? tenorDipilih : 2}
          anak={anak.map((a) => ({
            id: a.id,
            nama: a.nama,
            jenjangTerakhir: a.jenjangTerakhir ?? "",
            tingkat: a.tingkat ?? null,
          }))}
          anakIdAwal={anakIdAwal}
        />
      </div>
    </div>
  );
}
