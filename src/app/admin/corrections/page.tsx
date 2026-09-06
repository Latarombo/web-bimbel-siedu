import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";

export const dynamic = "force-dynamic";

// E9 — BR#18 sisi admin. Kontrak BELUM punya tabel pengajuan_koreksi
// (siapa minta, siapa approve, kapan, alasan, nilai sebelum) — butuh revisi
// kontrak + migrasi sebelum flow penuh. Sementara: daftar entri presensi/nilai
// yang sudah terkunci (lewat 7 hari) = kandidat koreksi manual.
function lewat7Hari(createdAt: string, sekarang: Date): boolean {
  return (sekarang.getTime() - new Date(createdAt).getTime()) > 7 * 86_400_000;
}

export default async function AdminCorrections() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/admin/corrections");

  const now = new Date();
  const [presensi, nilai, pendaftaran, anak, kelas, mapel] = await Promise.all([
    collect(db.orm.public.Presensi.all()),
    collect(db.orm.public.NilaiProgres.all()),
    collect(db.orm.public.Pendaftaran.all()),
    collect(db.orm.public.Anak.all()),
    collect(db.orm.public.Kelas.all()),
    collect(db.orm.public.MataPelajaran.all()),
  ]);
  const pById = new Map(pendaftaran.map((p) => [p.id, p]));
  const anakById = new Map(anak.map((a) => [a.id, a]));
  const kelasById = new Map(kelas.map((k) => [k.id, k]));
  const mapelById = new Map(mapel.map((m) => [m.id, m]));

  const label = (pendaftaranId: number) => {
    const p = pById.get(pendaftaranId);
    if (!p) return `pendaftaran #${pendaftaranId}`;
    const a = anakById.get(p.anakId);
    const k = kelasById.get(p.kelasId);
    return `${a?.nama ?? `anak#${p.anakId}`} · ${mapelById.get(k?.mataPelajaranId ?? 0)?.nama ?? "—"}`;
  };

  const presensiTerkunci = presensi.filter((x) => lewat7Hari(x.createdAt, now));
  const nilaiTerkunci = nilai.filter((x) => lewat7Hari(x.createdAt, now));

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Pengajuan Koreksi</h1>
      <p className="mt-1 text-sm text-muted">
        E9 — BR#18: entri presensi/nilai lewat 7 hari terkunci; koreksi harus lewat admin dengan jejak audit.
      </p>

      <Card className="mt-6 border-amber-300">
        <CardPad>
          <p className="text-sm font-semibold text-amber-800">Flow pengajuan koreksi belum aktif</p>
          <p className="mt-1 text-sm text-muted">
            Kontrak belum punya tabel <code>pengajuan_koreksi</code>. Sebelum tabel itu ada, koreksi di bawah dicatat manual (chat/formulir luar) dan diedit langsung di DB.
          </p>
        </CardPad>
      </Card>

      <h2 className="mt-8 font-semibold">Presensi terkunci ({presensiTerkunci.length})</h2>
      <ul className="mt-3 grid gap-2 text-sm">
        {presensiTerkunci.slice(0, 20).map((x) => (
          <li key={`p${x.id}`}>
            <Card><CardPad className="p-3">{label(x.pendaftaranId)} · {x.tanggalPertemuan} · {x.status} · input {x.createdAt.slice(0, 10)}</CardPad></Card>
          </li>
        ))}
        {presensiTerkunci.length === 0 ? <li className="text-muted">Belum ada.</li> : null}
      </ul>

      <h2 className="mt-8 font-semibold">Nilai terkunci ({nilaiTerkunci.length})</h2>
      <ul className="mt-3 grid gap-2 text-sm">
        {nilaiTerkunci.slice(0, 20).map((x) => (
          <li key={`n${x.id}`}>
            <Card><CardPad className="p-3">{label(x.pendaftaranId)} · {x.tanggal} · nilai {x.nilaiKuantitatif ?? "—"} · input {x.createdAt.slice(0, 10)}</CardPad></Card>
          </li>
        ))}
        {nilaiTerkunci.length === 0 ? <li className="text-muted">Belum ada.</li> : null}
      </ul>

      <div className="mt-4"><ButtonLink href="/admin/dashboard" variant="ghost">← Dashboard</ButtonLink></div>
    </div>
  );
}
