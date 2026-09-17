import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { AuthShell } from "@/components/auth-shell";
import ChildForm from "@/components/auth/child-form";

export const dynamic = "force-dynamic";

export default async function NewChildPage() {
  const tr = await getTranslations("parent");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) redirect({href: "/login?next=/children/new", locale});

  return (
    <AuthShell
      title={tr("text004")}
      subtitle={tr("text005")}
    >
      <ChildForm />
    </AuthShell>
  );
}
