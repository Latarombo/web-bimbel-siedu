import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import ProfileForm from "@/components/auth/profile-form";

export const dynamic = "force-dynamic";

// C12 — Edit Account Profile (di dropdown navbar "Profil").
export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/profile");
  if (session.user.role !== "orang_tua") redirect("/login");

  const [user] = await collect(
    db.orm.public.User.where((u) => u.id.eq(Number(session.user!.id))).all(),
  );

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Profil Akun</h1>
        <p className="mt-1 text-sm text-muted">Perbarui data akun orang tua.</p>
      </header>

      <Card>
        <CardPad>
          <ProfileForm
            name={user?.name ?? ""}
            email={user?.email ?? ""}
            alamat={user?.alamat ?? ""}
            nomorTelepon={user?.nomorTelepon ?? ""}
          />
        </CardPad>
      </Card>
    </div>
  );
}
