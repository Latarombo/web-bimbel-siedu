import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { Card, CardPad } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { kelasTersediaUntukJenjang, type Jenjang } from "@/lib/services/pendaftaran";
import DaftarForm from "@/components/pendaftaran/daftar-form";
import { rupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function DaftarKelasPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/classes");
  const { id } = await params;
  const kelasId = Number(id);
  if (!Number.isInteger(kelasId)) notFound();

  const ortuId = Number(session.user.id);
  const collect = async <T,>(src: AsyncIterable<T>) => {
    const out: T[] = [];
    for await (const r of src) out.push(r);
    return out;
  };

  const anak = await collect(
    db.orm.public.Anak.where((a) => a.orangTuaId.eq(ortuId)).all(),
  );
  if (anak.length === 0) {
    return (
      <Card>
        <CardPad className="text-center">
          <p className="text-sm text-muted">
            Lengkapi profil anak dulu sebelum mendaftar.
          </p>
        </CardPad>
      </Card>
    );
  }

  // Kelas target + kandidat lain untuk anak berjenjang sama.
  const semuaKelas = await kelasTersediaUntukJenjang((anak[0].jenjangTerakhir ?? "SD") as Jenjang);
  const kelas = semuaKelas.find((k) => k.id === kelasId);
  if (!kelas) notFound();

  const jadwal = (kelas.jadwalItem ?? [])
    .map((j) => `${j.hari} ${j.jamMulai}–${j.jamSelesai}`)
    .join(", ");

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Daftar: {kelas.mataPelajaran.nama}</h1>
      <p className="mt-1 text-sm text-muted">
        {kelas.guru.name} · {kelas.jenjang} · {jadwal || "Jadwal menyusul"} · sisa kuota{" "}
        {kelas.kuotaMaksimum - kelas.kuotaTerisi}
      </p>

      <Card className="mt-6">
        <CardPad>
          <div className="mb-5 flex flex-wrap gap-2">
            <Badge tone="brand">{kelas.mataPelajaran.nama}</Badge>
            <Badge>{kelas.jenjang}</Badge>
            <Badge tone="emerald">{kelas.periode.nama}</Badge>
          </div>
          <DaftarForm
            kelasId={kelas.id}
            biayaPeriode={Number(kelas.biayaPeriode)}
            biayaDp={kelas.biayaDp == null ? null : Number(kelas.biayaDp)}
            tenorMaksimum={kelas.tenorMaksimum}
            anak={anak.map((a) => ({
              id: a.id,
              nama: a.nama,
              jenjangTerakhir: a.jenjangTerakhir ?? "",
            }))}
          />
        </CardPad>
      </Card>
    </div>
  );
}
