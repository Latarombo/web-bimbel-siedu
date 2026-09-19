import { getTranslations, getLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { Card, CardPad } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { rupiah } from "@/lib/format";
import { redirect } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export default async function ChildrenPage() {
  const tr = await getTranslations("parent");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) {
    return redirect({href: "/login?next=/children", locale});
  }
  const ortuId = Number(session.user.id);

  const collect = async <T,>(src: AsyncIterable<T>) => {
    const out: T[] = [];
    for await (const r of src) out.push(r);
    return out;
  };

  // Anak + jumlah pendaftaran aktif per anak (untuk keterangan lock read-only).
  const anak = await collect(
    db.orm.public.Anak.where((a) => a.orangTuaId.eq(ortuId)).all(),
  );

  const aktifPerAnak = await Promise.all(
    anak.map(async (a) => {
      const rows = await collect(
        db.orm.public.Pendaftaran.where((p) => p.anakId.eq(a.id)).all(),
      );
      const aktif = rows.filter((p) =>
        ["menunggu_pembayaran", "terdaftar", "tertunggak"].includes(p.status),
      );
      return [a.id, aktif.length] as const;
    }),
  );
  const aktifMap = new Map(aktifPerAnak);

  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{tr("text006")}</h1>
          <p className="mt-1 text-sm text-muted">{tr("text007")}</p>
        </div>
        <ButtonLink href="/children/new">{tr("text008")}</ButtonLink>
      </header>

      {anak.length === 0 ? (
        <Card>
          <CardPad className="text-center">
            <p className="text-sm text-muted">{tr("text009")}</p>
            <ButtonLink href="/children/new" className="mt-4">
               {tr("text010")} </ButtonLink>
          </CardPad>
        </Card>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {anak.map((a) => {
            const nAktif = aktifMap.get(a.id) ?? 0;
            return (
              <li key={a.id}>
                <Card>
                  <CardPad>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate font-semibold">{a.nama}</p>
                        <p className="mt-0.5 text-sm text-muted">
                          {a.jenjangTerakhir ?? tr("text011")}  {tr("text012")} {a.tanggalLahir}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {nAktif > 0 ? <Badge tone="brand">{nAktif} {tr("text013")}</Badge> : null}
                        <Badge tone={a.persetujuanFoto ? "emerald" : "slate"}>
                          {a.persetujuanFoto ? tr("consentActive") : tr("consentRevoked")}
                        </Badge>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <ButtonLink href={`/children/${a.id}/edit`} variant="outline">
                         {tr("text014")} </ButtonLink>
                      <ButtonLink href={`/classes?jenjang=${a.jenjangTerakhir ?? ""}`}>
                         {tr("text015")} </ButtonLink>
                    </div>
                  </CardPad>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
