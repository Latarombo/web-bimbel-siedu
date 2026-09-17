import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { Link } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { rupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

// C6 — Payment History & Status (PRD F5 / UC 5.1).
// Filter tab via ?tab= (URL state, tanpa JS — pola shadcn Tabs di server component).

async function PembayaranBadge({ status }: { status: string }) {
  const tr = await getTranslations("parent");
  const tone =
    status === "berhasil" ? "emerald" : status === "gagal" ? "red" : status === "pending" ? "amber" : "slate";
  const label = status === "berhasil" ? tr("text148") : status === "pending" ? tr("text149") : status === "gagal" ? tr("text150") : status;
  return <Badge tone={tone}>{label}</Badge>;
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const tr = await getTranslations("parent");

  function labelTipe(tipe: string, cicilanKe: number | null) {
    if (tipe === "dp") return tr("text077");
    if (tipe === "cicilan") return `Cicilan ke-${cicilanKe ?? "-"}`;
    return tipe === "lunas" ? tr("text151") : tipe;
  }

  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) {
    return redirect({href: "/login?next=/payments", locale});
  }
  const ortuId = Number(session.user.id);
  const { tab } = await searchParams;
  const tabAktif = tab === "riwayat" ? "riwayat" : "belum-lunas";

  const anak = await collect(db.orm.public.Anak.where((a) => a.orangTuaId.eq(ortuId)).all());
  const anakIds = new Set(anak.map((a) => a.id));
  const namaAnak = new Map(anak.map((a) => [a.id, a.nama]));

  // Pendaftaran milik anak-anak orang tua ini + kelasnya (nama mapel).
  const pendaftaran = await collect(
    db.orm.public.Pendaftaran
      .include("kelas", (b) => b.select("id", "mataPelajaranId"))
      .all(),
  );
  const milikSaya = pendaftaran.filter((p) => anakIds.has(p.anakId));
  const pById = new Map(milikSaya.map((p) => [p.id, p]));

  // Nama mapel per kelas.
  const mapelIds = [...new Set(milikSaya.map((p) => p.kelas.mataPelajaranId))];
  const mapel = new Map<number, string>(
    (
      await Promise.all(
        mapelIds.map(async (mid) => {
          const rows = await collect(
            db.orm.public.MataPelajaran.where((m) => m.id.eq(mid)).all(),
          );
          return rows.map((m) => [m.id, m.nama] as const);
        }),
      )
    ).flat(),
  );

  // Semua tagihan pendaftaran milik saya.
  const tagihan = (
    await Promise.all(
      milikSaya.map((p) =>
        collect(
          db.orm.public.Pembayaran.where((b) => b.pendaftaranId.eq(p.id))
            .orderBy((b) => b.jatuhTempo.asc())
            .all(),
        ),
      ),
    )
  ).flat();

  const nowIso = new Date().toISOString().slice(0, 10);
  const belumLunas = tagihan.filter((b) => b.status === "pending" || b.status === "gagal");
  const jatuhTempo = belumLunas.filter((b) => (b.jatuhTempo ?? "") <= nowIso);
  const riwayat = tagihan.filter((b) => b.status === "berhasil");
  const rows = tabAktif === "riwayat" ? riwayat : belumLunas;
  const totalBelum = belumLunas.reduce((acc, b) => acc + Number(b.jumlah), 0);

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{tr("text146")}</h1>
        <p className="mt-1 text-sm text-muted">{tr("text152")}</p>
      </header>

      {/* Ringkasan — pola Dashboard Card DESIGN.md: top border emerald (keuangan). */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Card className="border-t-4 border-t-emerald-500">
          <CardPad>
            <p className="text-xs font-semibold uppercase text-muted">{tr("text153")}</p>
            <p className="mt-1 text-3xl font-bold">{rupiah(totalBelum)}</p>
            <p className="mt-1 text-sm text-muted">{belumLunas.length}  {tr("text154")}</p>
          </CardPad>
        </Card>
        <Card className="border-t-4 border-t-emerald-500">
          <CardPad>
            <p className="text-xs font-semibold uppercase text-muted">{tr("text039")}</p>
            <p className="mt-1 text-3xl font-bold">{jatuhTempo.length}</p>
            <p className="mt-1 text-sm text-muted">
              {jatuhTempo.length > 0
                ? tr("text155")
                : tr("text156")}
            </p>
          </CardPad>
        </Card>
      </section>

      {/* Filter tabs — pill container DESIGN.md */}
      <nav aria-label={tr("text157")} className="mt-8 inline-flex flex-wrap rounded-full bg-slate-100 p-1">
        {[
          ["belum-lunas", `Belum Lunas (${belumLunas.length})`],
          ["riwayat", `Riwayat (${riwayat.length})`],
        ].map(([key, label]) => (
          <Link
            key={key}
            href={`/payments?tab=${key}`}
            aria-current={tabAktif === key ? "page" : undefined}
            className={`min-w-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors sm:px-5 ${
              tabAktif === key ? "bg-white text-brand shadow-sm" : "text-slate-600 hover:text-slate-900"
            }`}
          >
            {label}
          </Link>
        ))}
      </nav>

      {/* Daftar tagihan — card list (mobile-safe, tanpa tabel lebar). */}
      {rows.length === 0 ? (
        <Card className="mt-4">
          <CardPad className="py-12 text-center">
            <p className="text-base font-semibold">
              {tabAktif === "riwayat" ? tr("text158") : tr("text159")}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
              {tabAktif === "riwayat"
                ? tr("text160")
                : tr("text161")}
            </p>
          </CardPad>
        </Card>
      ) : (
        <ul className="mt-4 grid gap-3">
          {rows.map((b) => {
            const p = pById.get(b.pendaftaranId);
            const due = b.jatuhTempo ? new Date(b.jatuhTempo).toLocaleDateString("id-ID") : "-";
            const bisaBayar = b.status === "pending" && (b.jatuhTempo ?? "") <= nowIso;
            return (
              <li key={b.id}>
                <Card>
                  <CardPad className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold">
                        {labelTipe(b.tipe, b.cicilanKe)} — {rupiah(Number(b.jumlah))}
                      </p>
                      <p className="mt-0.5 text-sm text-muted">
                        {p
                          ? `${namaAnak.get(p.anakId) ?? tr("text162")} · ${mapel.get(p.kelas.mataPelajaranId) ?? `Kelas #${p.kelasId}`}`
                          : tr("text028")}{" "}
                         {tr("text163")} {due}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <PembayaranBadge status={b.status} />
                      {bisaBayar ? (
                        <ButtonLink href={`/enrollments/${b.pendaftaranId}/pay`}>{tr("text047")}</ButtonLink>
                      ) : b.status === "pending" ? (
                        <span className="text-xs text-muted">{tr("text164")}</span>
                      ) : b.status === "gagal" ? (
                        <ButtonLink href={`/enrollments/${b.pendaftaranId}/pay`} variant="outline">
                           {tr("text165")} </ButtonLink>
                      ) : null}
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
