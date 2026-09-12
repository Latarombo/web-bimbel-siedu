import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { Card, CardPad } from "@/components/ui/card";

export const dynamic = "force-dynamic";

export default async function TeacherCorrections() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/teacher/corrections");

  // BR#18 — koreksi entri >7 hari lewat Admin. Guru cuma lihat penjelasan (data pengajuan ada di fase admin).
  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold tracking-tight">Pengajuan Koreksi</h1>
      <Card className="mt-6">
        <CardPad>
          <p className="text-sm text-muted">
            Presensi dan nilai yang sudah lewat 7 hari sejak input pertama terkunci (BR#18).
            Koreksi diajukan ke Admin: catatan siapa minta, siapa approve, kapan, alasan, dan nilai
            sebelum dikoreksi disimpan admin.
          </p>
          <p className="mt-3 text-sm">
            Alur: hubungi admin lewat kanal internal lembaga, sebutkan nama siswa, tanggal sesi,
            dan nilai/presensi sebelum dikoreksi. Setelah admin approve, data diperbarui admin.
          </p>
          <p className="mt-3 text-sm">
            <Link href="/teacher/grades" className="font-semibold text-brand underline">
              Lihat entri yang masih bisa diedit (≤7 hari)
            </Link>
          </p>
        </CardPad>
      </Card>
    </div>
  );
}
