import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOfficialCertificateData } from "@/lib/certificate";
import { OfficialCertificate } from "@/components/common/official-certificate";

export const dynamic = "force-dynamic";

export default async function ParentCertificatePage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const session = await auth();
  const { id, locale } = await params;
  if (!session?.user) {
    redirect(`/${locale}/login?next=/enrollments/${id}`);
  }

  const pid = Number(id);
  if (!Number.isInteger(pid)) notFound();

  const ortuId = Number(session.user.id);
  const data = await getOfficialCertificateData(pid, {
    backUrl: `/${locale}/enrollments/${pid}`,
    forParentId: ortuId,
  });

  if (!data) notFound();

  return <OfficialCertificate data={data} />;
}
