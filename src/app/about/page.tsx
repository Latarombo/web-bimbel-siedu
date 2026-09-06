import { Card, CardPad } from "@/components/ui/card";
import { Section, SectionTitle } from "@/components/ui/section";

export default function AboutPage() {
  return (
    <div>
      <Section className="py-10">
        <SectionTitle kicker="Tentang Siedu" title="Satu platform untuk orang tua, guru, dan admin" desc="Siedu single-tenant SaaS untuk satu lembaga per instalasi. Fokus: pendaftaran rapi, pembayaran transparan, tracking presensi & nilai real-time." />
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {[
            ["Untuk orang tua", "Kelola banyak anak dalam satu akun, daftar kelas sesuai jenjang, bayar lunas atau DP + cicilan manual, lihat riwayat & status."],
            ["Untuk guru", "Input presensi & nilai. Edit bebas 7 hari, setelah itu via koreksi admin (BR#18)."],
            ["Untuk admin", "CRUD mapel/periode/guru/kelas, pantau pendaftaran bermasalah, refund, duplikat anak, dan laporan."],
          ].map(([t, d]) => (
            <Card key={t}><CardPad><p className="font-bold">{t}</p><p className="mt-2 text-sm text-muted leading-relaxed">{d}</p></CardPad></Card>
          ))}
        </div>
      </Section>
      <Section className="pb-12" id="faq">
        <Card><CardPad><h2 className="font-bold">Prinsip operasional</h2><ul className="mt-3 list-disc pl-5 text-sm text-muted space-y-1"><li>Notifikasi email best-effort, tidak blok transaksi (BR#22).</li><li>Webhook & cron pakai row-lock + re-cek status + referensi_gateway unique (BR#17).</li><li>Refund DP hangus untuk voluntary; penuh untuk 4 kasus sistem (BR#19).</li></ul></CardPad></Card>
      </Section>
    </div>
  );
}
