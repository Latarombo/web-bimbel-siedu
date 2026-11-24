import { notFound } from "next/navigation";
import { getLocale } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect, Link } from "@/i18n/navigation";
import { getRaporDetail } from "@/lib/rapor";
import { ParentReportView } from "@/components/parent/reports/parent-report-view";
import { ArrowLeft, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ParentReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const locale = await getLocale();

  if (!session?.user) {
    return redirect({ href: "/login", locale });
  }

  const { id } = await params;
  const pendaftaranId = Number(id);
  if (!Number.isInteger(pendaftaranId) || pendaftaranId <= 0) {
    notFound();
  }

  const ortuId = Number(session.user.id);
  const rapor = await getRaporDetail(pendaftaranId, { forParentId: ortuId });

  if (!rapor) {
    notFound();
  }

  // Jika rapor belum diterbitkan resmi oleh guru
  if (!rapor.isDiterbitkan) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 text-center space-y-4 shadow-sm">
          <div className="size-12 mx-auto rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
            <Clock className="size-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Rapor Belum Diterbitkan
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-2 leading-relaxed">
              Guru pengampu mata pelajaran <b>{rapor.namaMapel}</b> sedang dalam tahap finalisasi rekapitulasi penilaian semester. Rapor akan tampil di sini setelah resmi diterbitkan.
            </p>
          </div>
          <div className="pt-2">
            <Link
              href={`/enrollments/${pendaftaranId}`}
              className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 hover:text-blue-700"
            >
              <ArrowLeft className="size-3.5" />
              <span>Kembali ke Rincian Pendaftaran</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <ParentReportView rapor={rapor} locale={locale} />;
}
