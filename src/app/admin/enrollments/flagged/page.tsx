import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Card, CardPad } from "@/components/ui/card";
import { StatusBadge } from "@/components/status-badge";
import { ButtonLink } from "@/components/ui/button";

export const dynamic = "force-dynamic";

// E6 — pendaftaran bermasalah: tunggakan, batal timeout, batal tunggakan, batal kelas.
// Wireframe kasar: format final menunggu rumusan BR khusus (⚠️ di daftar halaman).
const STATUS_MASALAH = ["tertunggak", "dibatalkan_timeout", "dibatalkan_tunggakan", "dibatalkan_kelas"];

export default async function AdminFlagged({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/admin/enrollments/flagged");
  const { status } = await searchParams;
  const filter = status && STATUS_MASALAH.includes(status) ? status : "semua";

  const [pendaftaran, anak, kelas, mapel] = await Promise.all([
    STATUS_MASALAH.includes(filter)
      ? collect(db.orm.public.Pendaftaran.where((p) => p.status.eq(filter as never)).all())
      : collect(db.orm.public.Pendaftaran.all()),
    collect(db.orm.public.Anak.all()),
    collect(db.orm.public.Kelas.all()),
    collect(db.orm.public.MataPelajaran.all()),
  ]);
  const anakById = new Map(anak.map((a) => [a.id, a]));
  const kelasById = new Map(kelas.map((k) => [k.id, k]));
  const mapelById = new Map(mapel.map((m) => [m.id, m]));

  const masalah = pendaftaran.filter((p) => STATUS_MASALAH.includes(p.status));
  const urut = [...masalah].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Pendaftaran Bermasalah</h1>
      <p className="mt-1 text-sm text-muted">
        E6 — tunggakan & pembatalan otomatis. Wireframe kasar; format final menunggu rumusan BR.
      </p>

      {/* Filter tabs — pola pill yang sama dengan halaman parent */}
      <nav aria-label="Filter status pendaftaran" className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link
          href="/admin/enrollments/flagged"
          aria-current={filter === "semua" ? "page" : undefined}
          className={`rounded-full px-4 py-1.5 transition-colors ${
            filter === "semua"
              ? "bg-brand font-semibold text-white"
              : "border border-border text-muted hover:border-slate-300"
          }`}
        >
          semua ({masalah.length})
        </Link>
        {STATUS_MASALAH.map((s) => {
          const n = masalah.filter((p) => p.status === s).length;
          return (
            <Link
              key={s}
              href={`/admin/enrollments/flagged?status=${s}`}
              aria-current={filter === s ? "page" : undefined}
              className={`rounded-full px-4 py-1.5 transition-colors ${
                filter === s
                  ? "bg-brand font-semibold text-white"
                  : "border border-border text-muted hover:border-slate-300"
              }`}
            >
              {s.replaceAll("_", " ")} ({n})
            </Link>
          );
        })}
      </nav>

      <ul className="mt-6 grid gap-3">
        {urut.map((p) => {
          const a = anakById.get(p.anakId);
          const k = kelasById.get(p.kelasId);
          return (
            <li key={p.id}>
              <Card>
                <CardPad className="p-4">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold">
                        {a?.nama ?? `anak#${p.anakId}`} · {mapelById.get(k?.mataPelajaranId ?? 0)?.nama ?? `kelas#${p.kelasId}`}
                      </p>
                      <p className="text-sm text-muted">
                        pendaftaran #{p.id} · {k?.jenjang ?? "—"} · daftar {p.createdAt.slice(0, 10)} · metode {p.metodeBayar}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                </CardPad>
              </Card>
            </li>
          );
        })}
      </ul>
      {urut.length === 0 ? <p className="mt-6 text-sm text-muted">Tidak ada pendaftaran bermasalah.</p> : null}

      <div className="mt-4"><ButtonLink href="/admin/dashboard" variant="ghost">← Dashboard</ButtonLink></div>
    </div>
  );
}
