import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { AuthShell } from "@/components/auth-shell";
import ChildForm from "@/components/auth/child-form";

export const dynamic = "force-dynamic";

export default async function NewChildPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/children/new");

  return (
    <AuthShell
      title="Tambah profil anak"
      subtitle="Bisa tambah lebih dari satu anak — satu akun untuk semua (PRD F2)."
    >
      <ChildForm />
    </AuthShell>
  );
}
