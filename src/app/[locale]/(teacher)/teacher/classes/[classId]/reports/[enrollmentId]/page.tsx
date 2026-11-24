import { getLocale } from "next-intl/server";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getRaporDetail } from "@/lib/rapor";
import { ReportEditorView } from "@/components/teacher/reports/report-editor-view";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TeacherStudentReportPage({
  params,
}: {
  params: Promise<{ classId: string; enrollmentId: string }>;
}) {
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) return redirect("/login?next=/teacher/classes");

  const { classId, enrollmentId } = await params;
  const kid = Number(classId);
  const eid = Number(enrollmentId);
  if (!Number.isInteger(kid) || !Number.isInteger(eid)) notFound();
  const guruId = Number(session.user.id);

  const reportData = await getRaporDetail(eid, { forTeacherId: guruId });
  if (!reportData) notFound();

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <ReportEditorView data={reportData} classId={kid} />
    </div>
  );
}
