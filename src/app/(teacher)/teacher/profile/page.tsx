import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import GuruProfilForm from "@/components/teacher/guru-profil-form";

export const dynamic = "force-dynamic";

export default async function TeacherProfile() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/teacher/profile");
  const guruId = Number(session.user.id);

  const [guru] = await collect(db.orm.public.User.where((u) => u.id.eq(guruId)).all());
  if (!guru) redirect("/login");

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Profil Guru</h1>
      <p className="mt-1 text-sm text-muted">{guru.email}</p>
      <Card className="mt-6">
        <CardPad>
          <GuruProfilForm
            defaults={{
              nama: guru.name,
              alamat: guru.alamat ?? "",
              nomorTelepon: guru.nomorTelepon ?? "",
            }}
          />
        </CardPad>
      </Card>
    </div>
  );
}
