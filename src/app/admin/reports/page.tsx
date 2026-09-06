import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export const dynamic = "force-dynamic";

// E10 — laporan pendaftaran & keuangan. Wireframe kasar: agregat per periode;
// format final (export, filter, grafik) menunggu diskusi.
const AKTIF = ["menunggu_pembayaran", "terdaftar", "tertunggak"];

export default async function AdminReports() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/admin/reports");

  const [periode, pendaftaran, pembayaran] = await Promise.all([
    collect(db.orm.public.PeriodePendaftaran.all()),
    collect(db.orm.public.Pendaftaran.all()),
    collect(db.orm.public.Pembayaran.all()),
  ]);
  const urut = [...periode].sort((a, b) => b.tanggalMulai.localeCompare(a.tanggalMulai));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Laporan</h1>
      <p className="mt-1 text-sm text-muted">
        E10 — ringkasan pendaftaran &amp; keuangan per periode. Wireframe kasar; format final menunggu diskusi.
      </p>

      <div className="mt-6 grid gap-4">
        {urut.map((pr) => {
          const pP = pendaftaran.filter((p) => p.periodeId === pr.id);
          const byStatus = (s: string) => pP.filter((p) => p.status === s).length;
          const tagihanIds = new Set(pP.map((p) => p.id));
          const bP = pembayaran.filter((b) => tagihanIds.has(b.pendaftaranId));
          const rupiah = (list: typeof bP) =>
            `Rp${list.reduce((acc, b) => acc + Number(b.jumlah), 0).toLocaleString("id-ID")}`;
          const berhasil = bP.filter((b) => b.status === "berhasil");
          const pending = bP.filter((b) => b.status === "pending");

          return (
            <Card key={pr.id}>
              <CardPad>
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{pr.nama}</p>
                    <p className="text-sm text-muted">
                      {pr.tanggalMulai} s/d {pr.tanggalSelesai} · status {pr.status}
                    </p>
                  </div>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-semibold">Pendaftaran ({pP.length})</p>
                    <ul className="mt-1 space-y-0.5 text-sm text-muted">
                      <li>aktif: {AKTIF.reduce((a, s) => a + byStatus(s), 0)}</li>
                      <li>terdaftar: {byStatus("terdaftar")} · tertunggak: {byStatus("tertunggak")} · menunggu bayar: {byStatus("menunggu_pembayaran")}</li>
                      <li>batal: {pP.length - AKTIF.reduce((a, s) => a + byStatus(s), 0)}</li>
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">Keuangan</p>
                    <ul className="mt-1 space-y-0.5 text-sm text-muted">
                      <li>terkumpul ({berhasil.length} tagihan): {rupiah(berhasil)}</li>
                      <li>pending ({pending.length} tagihan): {rupiah(pending)}</li>
                      <li>total tagihan terbit: {rupiah(bP)}</li>
                    </ul>
                  </div>
                </div>
              </CardPad>
            </Card>
          );
        })}
        {urut.length === 0 ? <p className="text-sm text-muted">Belum ada periode.</p> : null}
      </div>

      <div className="mt-4"><ButtonLink href="/admin/dashboard" variant="ghost">← Dashboard</ButtonLink></div>
    </div>
  );
}
