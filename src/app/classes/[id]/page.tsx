import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardPad } from "@/components/ui/card";
import { Section } from "@/components/ui/section";
import { KELAS, rupiah } from "@/lib/placeholder";

export default async function ClassDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const k = KELAS.find((x) => x.id === id);
  if (!k) return notFound();
  const pct = Math.round((k.kuota.terisi / k.kuota.maksimum) * 100);

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
                  <Badge tone="brand">{k.jenjang}</Badge>
                  <Badge tone={pct >= 85 ? "amber" : "slate"}>{k.kuota.terisi}/{k.kuota.maksimum} terisi</Badge>
                  <Badge tone="slate">{k.periode}</Badge>
                </div>
                <h1 className="mt-4 text-2xl font-black tracking-tight">{k.mapel}</h1>
                <p className="mt-2 text-sm text-muted">Pengajar: <span className="font-semibold text-foreground">{k.guru}</span> · {k.hari} {k.jam}</p>

                <div className="mt-6 grid sm:grid-cols-3 gap-3">
                  <div className="rounded-2xl border border-border bg-slate-50 p-4">
                    <p className="text-xs font-semibold text-muted uppercase tracking-widest">Biaya periode</p>
                    <p className="mt-1 text-lg font-black">{rupiah(k.biayaPeriode)}</p>
                    <p className="text-xs text-muted">Sekali bayar lunas</p>
                  </div>
                  <div className="rounded-2xl border border-border bg-white p-4">
                    <p className="text-xs font-semibold text-muted uppercase tracking-widest">Skema DP</p>
                    {k.biayaDp !== null ? <><p className="mt-1 text-lg font-black">{rupiah(k.biayaDp)}</p><p className="text-xs text-muted">+ cicilan manual</p></> : <p className="mt-1 text-sm font-semibold">Hanya lunas (BR#12)</p>}
                  </div>
                  <div className="rounded-2xl border border-border bg-white p-4">
                    <p className="text-xs font-semibold text-muted uppercase tracking-widest">Kuota</p>
                    <p className="mt-1 text-lg font-black">{pct}% terisi</p>
                    <p className="text-xs text-muted">Lock saat daftar (BR#1)</p>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-border p-4 bg-amber-50/50">
                  <p className="text-sm font-semibold">Catatan pembayaran</p>
                  <ul className="mt-2 list-disc pl-5 text-sm text-muted space-y-1">
                    <li>Cicilan manual — klik Bayar tiap jatuh tempo. Tidak auto-debit (BR#24).</li>
                    <li>Kanal cicilan kartu/BNPL dimatikan di Midtrans Snap (BR#23).</li>
                    <li>Timeout 24 jam tanpa bayar → dibatalkan_timeout & kuota dilepas (BR#2/BR#11).</li>
                  </ul>
                </div>
              </CardPad>
            </Card>

            <Card className="mt-6">
              <CardPad>
                <h2 className="font-bold">Jadwal & aturan</h2>
                <ul className="mt-3 space-y-2 text-sm text-muted">
                  <li>• Satu anak tidak boleh 2 pendaftaran aktif bentrok jadwal di periode sama (BR#9).</li>
                  <li>• Satu guru tidak boleh bentrok jadwal di periode sama (BR#6).</li>
                  <li>• Kelas difilter jenjang anak saat daftar (BR#13).</li>
                </ul>
              </CardPad>
            </Card>
          </div>

          <div className="lg:col-span-4">
            <Card className="sticky top-[76px]">
              <CardPad className="space-y-3">
                <p className="text-sm font-bold">Daftar kelas ini</p>
                <p className="text-sm text-muted">Pilih anak → pilih metode bayar → kuota terkunci (BR#1) → buat tagihan (BR#14).</p>
                <Link href="/register" className="block text-center rounded-full bg-brand text-white py-3 text-sm font-semibold hover:bg-blue-700">Daftar sebagai orang tua</Link>
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
