import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardPad } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { kelasAktifPublik, toKelasKatalog } from "@/lib/kelas";
import { rupiah } from "@/lib/format";

export const dynamic = "force-dynamic";

export default async function ClassDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const kelasId = Number(id);
  const all = await kelasAktifPublik();
  const k = all.find((x) => x.id === kelasId);
  if (!k) return notFound();
  const kc = toKelasKatalog(k);
  const pct = Math.round((kc.kuota.terisi / kc.kuota.maksimum) * 100);

  return (
    <div>
      <Section className="py-8">
        <Link href="/classes" className="text-sm font-semibold text-muted hover:text-foreground">← Kembali ke katalog</Link>
        <div className="mt-4 grid lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8">
            <Card className="overflow-hidden">
              <div className="h-1.5 w-full bg-brand" />
              <CardPad>
                <div className="flex flex-wrap gap-2">
                  <Badge tone="brand">{kc.jenjang}</Badge>
                  <Badge tone={pct >= 85 ? "amber" : "slate"}>{kc.kuota.terisi}/{kc.kuota.maksimum} terisi</Badge>
                  <Badge tone="slate">{kc.periode}</Badge>
                </div>
                <h1 className="mt-4 text-2xl font-black tracking-tight">{kc.mapel}</h1>
                <p className="mt-2 text-sm text-muted">Pengajar: <span className="font-semibold text-foreground">{kc.guru}</span> · {kc.jadwal}</p>

                <div className="mt-6 grid sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-border bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-muted uppercase tracking-widest">Biaya periode</p>
                    <p className="mt-1 text-lg font-black">{rupiah(kc.biayaPeriode)}</p>
                    <p className="text-xs text-muted">Sekali bayar lunas</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-white p-4">
                    <p className="text-xs font-semibold text-muted uppercase tracking-widest">Skema DP</p>
                    {kc.biayaDp !== null ? <><p className="mt-1 text-lg font-black">{rupiah(kc.biayaDp)}</p><p className="text-xs text-muted">+ cicilan manual</p></> : <p className="mt-1 text-sm font-semibold">Hanya lunas</p>}
                  </div>
                  <div className="rounded-2xl border border-border bg-white p-4">
                    <p className="text-xs font-semibold text-muted uppercase tracking-widest">Kuota</p>
                    <p className="mt-1 text-lg font-black">{pct}% terisi</p>
                    <p className="text-xs text-muted">Dikunci saat daftar</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-border p-4 bg-amber-50/50">
                  <p className="text-sm font-semibold">Catatan pembayaran</p>
                  <ul className="mt-2 list-disc pl-5 text-sm text-muted space-y-1">
                    <li>Cicilan manual — klik Bayar tiap jatuh tempo. Tidak ada auto-debit.</li>
                    <li>Pembayaran via Midtrans; kanal kartu kredit/BNPL untuk cicilan dimatikan.</li>
                    <li>Batas bayar 24 jam tanpa bayar → pendaftaran batal otomatis & kuota dibuka kembali.</li>
                  </ul>
                </div>
              </CardPad>
            </Card>

            <Card className="mt-6">
              <CardPad>
                <h2 className="font-bold">Jadwal & aturan</h2>
                <ul className="mt-3 space-y-2 text-sm text-muted">
                  <li>• Jadwal pertemuan: {kc.jadwal}.</li>
                  <li>• Satu anak tidak bisa daftar 2 kelas yang jadwalnya bentrok di periode yang sama.</li>
                  <li>• Kelas yang tampil saat daftar disesuaikan dengan jenjang anak.</li>
                </ul>
              </CardPad>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <Card className="sticky top-[76px]">
              <CardPad className="space-y-3">
                <p className="text-sm font-bold">Daftar kelas ini</p>
                <p className="text-sm text-muted">Pilih anak → pilih metode bayar → kuota langsung dikunci → tagihan dibuat.</p>
                <Link href={`/classes/${kc.id}/daftar`} className="block text-center rounded-full bg-brand text-white py-3 text-sm font-semibold hover:bg-brand-strong">Daftar kelas ini</Link>
                <Link href="/login" className="block text-center rounded-full border border-border py-3 text-sm font-semibold hover:border-foreground">Sudah punya akun? Masuk</Link>
                <p className="text-xs text-muted text-center">Butuh bantuan? <Link href="/about#faq" className="text-brand hover:underline">FAQ</Link></p>
              </CardPad>
            </Card>
          </div>
        </div>
      </Section>
    </div>
  );
}
