import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOfficialReportCardData } from "@/lib/report-card";
import { OfficialReportCard } from "@/components/common/official-report-card";

export const dynamic = "force-dynamic";

export default async function TeacherReportCardPage({
  params,
}: {
  params: Promise<{ classId: string; enrollmentId: string; locale: string }>;
}) {
  const session = await auth();
  const { classId, enrollmentId, locale } = await params;
  if (!session?.user) {
    redirect(`/${locale}/login?next=/teacher/classes/${classId}`);
  }

  const cid = Number(classId);
  const eid = Number(enrollmentId);
  if (!Number.isInteger(cid) || !Number.isInteger(eid)) notFound();

  const guruId = Number(session.user.id);
  const data = await getOfficialReportCardData(eid, {
    backUrl: `/${locale}/teacher/classes/${cid}`,
    forTeacherId: guruId,
  });

  if (!data) notFound();

  return <OfficialReportCard data={data} />;
}
