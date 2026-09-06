import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button";
import { prosesPengajuan } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

// E7 — verifikasi pengajuan refund/pembatalan. Keputusan admin: setujui/tolak
// dengan catatan. Eksekusi pembatalan pendaftaran + refund uang ada di alur
// pembatalan (C7) dan payment (C4-C6) — tidak dijalankan ulang di sini (BR#19).
export default async function AdminRefunds({ searchParams }: { searchParams: Promise<{ riwayat?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/admin/refunds");
  const { riwayat } = await searchParams;
  const tampilkanRiwayat = riwayat === "1";

  const [pengajuan, pendaftaran, anak, kelas, mapel, admin] = await Promise.all([
    collect(db.orm.public.PengajuanPembatalan.all()),
    collect(db.orm.public.Pendaftaran.all()),
    collect(db.orm.public.Anak.all()),
    collect(db.orm.public.Kelas.all()),
    collect(db.orm.public.MataPelajaran.all()),
    collect(db.orm.public.User.where((u) => u.role.eq("admin")).all()),
  ]);
  const pById = new Map(pendaftaran.map((p) => [p.id, p]));
  const anakById = new Map(anak.map((a) => [a.id, a]));
  const kelasById = new Map(kelas.map((k) => [k.id, k]));
  const mapelById = new Map(mapel.map((m) => [m.id, m]));
  const adminById = new Map(admin.map((a) => [a.id, a]));

  const daftar = [...pengajuan]
    .filter((p) => (tampilkanRiwayat ? true : p.status === "menunggu"))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Verifikasi Refund</h1>
      <p className="mt-1 text-sm text-muted">
        E7 — keputusan atas pengajuan pembatalan orang tua.{" "}
        <Link href={tampilkanRiwayat ? "/admin/refunds" : "/admin/refunds?riwayat=1"} className="underline">
          {tampilkanRiwayat ? "Sembunyikan riwayat" : "Tampilkan riwayat"}
        </Link>
      </p>

      <ul className="mt-6 grid gap-4">
        {daftar.map((q) => {
          const p = pById.get(q.pendaftaranId);
          const a = p ? anakById.get(p.anakId) : undefined;
          const k = p ? kelasById.get(p.kelasId) : undefined;
          const kategoriLabel = q.kategori === "lainnya" ? "Lainnya (DP hangus, BR#19)" : q.kategori.replaceAll("_", " ");
          return (
            <li key={q.id}>
              <Card>
                <CardPad>
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">
                        {a?.nama ?? `anak#${p?.anakId ?? q.pendaftaranId}`} · {mapelById.get(k?.mataPelajaranId ?? 0)?.nama ?? "—"}
                      </p>
                      <p className="text-sm text-muted">
                        pengajuan #{q.id} · pendaftaran #{q.pendaftaranId} · kategori: {kategoriLabel} · diajukan {q.createdAt.slice(0, 10)}
                      </p>
                      <p className="mt-2 whitespace-pre-line text-sm">{q.alasan}</p>
                    </div>
                    <Badge tone={q.status === "disetujui" ? "emerald" : q.status === "ditolak" ? "red" : "amber"}>{q.status}</Badge>
                  </div>

                  {q.status === "menunggu" ? (
                    <form action={prosesPengajuan} className="mt-4 space-y-3 border-t border-border pt-4">
                      <input type="hidden" name="pengajuan_id" value={q.id} />
                      <label className="block">
                        <span className="text-sm font-semibold">Catatan admin</span>
                        <textarea
                          name="catatan_admin"
                          rows={2}
                          maxLength={500}
                          placeholder="cth. Bukti transfer diverifikasi, refund diproses ke rekening asal."
                          className="mt-1.5 w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand"
                        />
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <Button type="submit" name="keputusan" value="disetujui">Setujui</Button>
                        <Button type="submit" name="keputusan" value="ditolak" variant="secondary" className="text-red-600">Tolak</Button>
                      </div>
                    </form>
                  ) : (
                    <p className="mt-3 border-t border-border pt-3 text-sm text-muted">
                      Diproses {q.diprosesPada?.slice(0, 10) ?? "—"}
                      {q.diprosesOleh ? ` oleh ${adminById.get(q.diprosesOleh)?.name ?? `admin#${q.diprosesOleh}`}` : ""}
                      {q.catatanAdmin ? ` · catatan: ${q.catatanAdmin}` : ""}
                    </p>
                  )}
                </CardPad>
              </Card>
            </li>
          );
        })}
      </ul>
      {daftar.length === 0 ? <p className="mt-6 text-sm text-muted">Tidak ada pengajuan.</p> : null}

      <div className="mt-4"><ButtonLink href="/admin/dashboard" variant="ghost">← Dashboard</ButtonLink></div>
    </div>
  );
}
