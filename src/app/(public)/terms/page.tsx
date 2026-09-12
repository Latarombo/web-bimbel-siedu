import { Card, CardPad } from "@/components/ui/card";
import { Section } from "@/components/ui/section";

export default function TermsPage() {
  return (
    <Section className="py-10">
      <h1 className="text-2xl font-black tracking-tight">Syarat & Ketentuan</h1>
      <p className="mt-2 text-sm text-muted">Ringkasan operasional Siedu. Untuk dokumen hukum final, hubungi lembaga.</p>
      <div className="mt-6 grid gap-4">
        {[
          ["Akun & peran", "3 peran: orang tua (daftar sendiri), guru & admin (dibuat admin). Satu akun orang tua bisa untuk banyak anak."],
          ["Pendaftaran", "Kelas disesuaikan jenjang anak. Jadwal bentrok dicegah. Kuota langsung dikunci saat daftar."],
          ["Pembayaran", "Lunas atau DP + cicilan manual, tanpa auto-debit. Kelas tanpa opsi DP hanya bisa lunas. Tagihan dibuat saat daftar."],
          ["Batas bayar & tunggakan", "Tanpa bayar 24 jam → pendaftaran batal otomatis & kuota dibuka kembali. Tunggakan lewat 7 hari kerja → pendaftaran dibatalkan."],
          ["Refund", "DP hangus untuk pembatalan atas permintaan sendiri. Refund penuh hanya 4 kasus: kesalahan sistem, salah nominal, salah rekening, salah pilih kelas yang terbukti."],
          ["Presensi & nilai", "Guru edit bebas 7 hari; setelah itu lewat pengajuan koreksi ke admin."],
        ].map(([t, d]) => (
          <Card key={t}><CardPad><h2 className="font-bold text-sm">{t}</h2><p className="mt-2 text-sm text-muted leading-relaxed">{d}</p></CardPad></Card>
        ))}
      </div>
    </Section>
  );
}
