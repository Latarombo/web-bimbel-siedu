import { Card, CardPad } from "@/components/ui/card";
import { Section } from "@/components/ui/section";

export default function TermsPage() {
  return (
    <Section className="py-10">
      <h1 className="text-2xl font-black tracking-tight">Syarat & Ketentuan</h1>
      <p className="mt-2 text-sm text-muted">Ringkasan operasional Siedu. Untuk dokumen hukum final, hubungi lembaga.</p>
      <div className="mt-6 grid gap-4">
        {[
          ["Akun & peran", "3 peran: orang_tua (self-signup), guru & admin (dibuat admin). Satu akun orang tua bisa banyak anak."],
          ["Pendaftaran", "Kelas difilter jenjang anak (BR#13). Jadwal bentrok dicegah (BR#9/BR#6). Kuota dikunci saat submit (BR#1)."],
          ["Pembayaran", "Lunas atau DP + cicilan. DP + cicilan ditolak kalau kelas tanpa biaya_dp (BR#12). Tagihan dibuat saat daftar (BR#14). Cicilan manual, bukan auto-debit (BR#24)."],
          ["Timeout & tunggakan", "Tanpa bayar 24 jam → dibatalkan_timeout & kuota dilepas (BR#2/BR#11). Tenggang 7 hari kerja lalu dibatalkan_tunggakan (BR#4/BR#7)."],
          ["Refund (BR#19)", "DP hangus untuk pembatalan voluntary. Refund penuh hanya 4 kasus: kesalahan sistem, salah nominal, salah rekening, salah pilih kelas terbukti."],
          ["Presensi & nilai (BR#18)", "Guru edit 7 hari bebas; setelah itu via pengajuan koreksi ke admin."],
        ].map(([t, d]) => (
          <Card key={t}><CardPad><h2 className="font-bold text-sm">{t}</h2><p className="mt-2 text-sm text-muted leading-relaxed">{d}</p></CardPad></Card>
        ))}
      </div>
    </Section>
  );
}
