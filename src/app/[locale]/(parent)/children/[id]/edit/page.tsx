import { getTranslations, getLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { AuthShell } from "@/components/auth-shell";
import ChildForm from "@/components/auth/child-form";
import { Card, CardPad } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function EditChildPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const tr = await getTranslations("parent");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) {
    return redirect({href: "/login?next=/children", locale});
  }
  const { id } = await params;
  const anakId = Number(id);
  if (!Number.isInteger(anakId)) notFound();

  const ortuId = Number(session.user.id);
  const collect = async <T,>(src: AsyncIterable<T>) => {
    const out: T[] = [];
    for await (const r of src) out.push(r);
    return out;
  };

  const anak = await collect(
    db.orm.public.Anak.where((a) => a.id.eq(anakId))
      .where((a) => a.orangTuaId.eq(ortuId))
      .all(),
  );
  if (anak.length === 0) notFound();
  const a = anak[0];

  // Keputusan #5 — kunci read-only saat pendaftaran aktif; form tampil tapi submit ditolak server.
  const rows = await collect(
    db.orm.public.Pendaftaran.where((p) => p.anakId.eq(anakId)).all(),
  );
  const terkunci = rows.some((p) =>
    ["menunggu_pembayaran", "terdaftar", "tertunggak"].includes(p.status),
  );

  return (
    <AuthShell
      title={`Edit profil ${a.nama}`}
      subtitle={
        terkunci
          ? tr("text001")
          : tr("text002")
      }
    >
      {terkunci ? (
        <Card>
          <CardPad>
            <p className="text-sm font-medium text-amber-800">
               {tr("text003")} </p>
          </CardPad>
        </Card>
      ) : (
        <ChildForm
          anak={{
            id: a.id,
            nama: a.nama,
            tanggalLahir: a.tanggalLahir,
            jenjangTerakhir: a.jenjangTerakhir ?? "",
            emailNotifikasi: a.emailNotifikasi ?? "",
            nomorTelepon: a.nomorTelepon ?? "",
          }}
        />
      )}
    </AuthShell>
  );
}
