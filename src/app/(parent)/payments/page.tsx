import { redirect } from "next/navigation";
import Link from "next/link";
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

function PembayaranBadge({ status }: { status: string }) {
  const tone =
    status === "berhasil" ? "emerald" : status === "gagal" ? "red" : status === "pending" ? "amber" : "slate";
  const label = status === "berhasil" ? "Lunas" : status === "pending" ? "Menunggu" : status === "gagal" ? "Gagal" : status;
  return <Badge tone={tone}>{label}</Badge>;
}

function labelTipe(tipe: string, cicilanKe: number | null) {
  if (tipe === "dp") return "DP";
  if (tipe === "cicilan") return `Cicilan ke-${cicilanKe ?? "-"}`;
  return tipe === "lunas" ? "Lunas penuh" : tipe;
}

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/payments");
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
    <div className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Payments</h1>
        <p className="mt-1 text-sm text-muted">Status tagihan dan riwayat pembayaran semua anak.</p>
      </header>

      {/* Ringkasan — pola Dashboard Card DESIGN.md: top border emerald (keuangan). */}
      <section className="grid gap-4 sm:grid-cols-2">
        <Card className="border-t-4 border-t-emerald-500">
          <CardPad>
            <p className="text-xs font-semibold uppercase text-muted">Belum dibayar</p>
            <p className="mt-1 text-3xl font-bold">{rupiah(totalBelum)}</p>
            <p className="mt-1 text-sm text-muted">{belumLunas.length} tagihan (pending / gagal)</p>
          </CardPad>
        </Card>
        <Card className="border-t-4 border-t-emerald-500">
          <CardPad>
            <p className="text-xs font-semibold uppercase text-muted">Jatuh tempo</p>
            <p className="mt-1 text-3xl font-bold">{jatuhTempo.length}</p>
            <p className="mt-1 text-sm text-muted">
              {jatuhTempo.length > 0
                ? "Segera bayar untuk menghindari status tunggakan."
                : "Tidak ada tagihan lewat tanggal."}
            </p>
          </CardPad>
        </Card>
      </section>

      {/* Filter tabs — pill container DESIGN.md */}
      <nav aria-label="Filter pembayaran" className="mt-8 inline-flex rounded-full bg-slate-100 p-1">
        {[
          ["belum-lunas", `Belum Lunas (${belumLunas.length})`],
          ["riwayat", `Riwayat (${riwayat.length})`],
        ].map(([key, label]) => (
          <Link
            key={key}
            href={`/payments?tab=${key}`}
            aria-current={tabAktif === key ? "page" : undefined}
            className={`rounded-full px-5 py-2 text-sm font-semibold transition-colors ${
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
              {tabAktif === "riwayat" ? "Belum ada pembayaran" : "Tidak ada tagihan"}
            </p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-muted">
              {tabAktif === "riwayat"
                ? "Riwayat pembayaran yang sudah berhasil akan tampil di sini."
                : "Semua tagihan lunas. Lihat riwayat untuk pembayaran sebelumnya."}
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
                          ? `${namaAnak.get(p.anakId) ?? "Anak"} · ${mapel.get(p.kelas.mataPelajaranId) ?? `Kelas #${p.kelasId}`}`
                          : "Pendaftaran"}{" "}
                        · jatuh tempo {due}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <PembayaranBadge status={b.status} />
                      {bisaBayar ? (
                        <ButtonLink href={`/enrollments/${b.pendaftaranId}/pay`}>Bayar</ButtonLink>
                      ) : b.status === "pending" ? (
                        <span className="text-xs text-muted">Belum jatuh tempo</span>
                      ) : b.status === "gagal" ? (
                        <ButtonLink href={`/enrollments/${b.pendaftaranId}/pay`} variant="outline">
                          Coba Lagi
                        </ButtonLink>
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
