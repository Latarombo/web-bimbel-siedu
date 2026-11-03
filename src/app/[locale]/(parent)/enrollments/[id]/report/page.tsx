import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { getOfficialReportCardData } from "@/lib/report-card";
import { OfficialReportCard } from "@/components/common/official-report-card";

export const dynamic = "force-dynamic";

export default async function ParentReportCardPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const session = await auth();
  const { id, locale } = await params;
  if (!session?.user) {
    return redirect({ href: `/login?next=/enrollments/${id}`, locale });
  }

  const pid = Number(id);
  if (!Number.isInteger(pid)) notFound();

  const ortuId = Number(session.user.id);
  const data = await getOfficialReportCardData(pid, {
    backUrl: `/${locale}/enrollments/${pid}`,
    forParentId: ortuId,
  });

  if (!data) notFound();

  return <OfficialReportCard data={data} />;
}
