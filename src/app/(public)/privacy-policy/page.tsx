import { Card, CardPad } from "@/components/ui/card";
import { Section } from "@/components/ui/section";

export default function PrivacyPage() {
  return (
    <Section className="py-10">
      <h1 className="text-2xl font-black tracking-tight">Kebijakan Privasi</h1>
      <p className="mt-2 text-sm text-muted">Terakhir diperbarui: 5 Sep 2026 · Ringkasan ramah baca, bukan dokumen hukum final.</p>
      <div className="mt-6 grid gap-4">
        {[
          ["Data yang kami kumpulkan", "Akun orang tua (email, nama, alamat, nomor telepon), profil anak (nama, tanggal lahir, jenjang, email_notifikasi opsional), pendaftaran & pembayaran. Anak tidak punya akun login terpisah."],
          ["Persetujuan saat registrasi", "Saat registrasi orang tua mencentang 2 persetujuan: (a) setuju kebijakan privasi, (b) menyatakan sebagai wali sah anak."],
          ["Penggunaan data", "Untuk pendaftaran kelas, verifikasi kuota, penagihan, presensi/nilai, dan notifikasi status. Email notifikasi anak hanya untuk notifikasi, tidak pernah untuk login."],
          ["Pembayaran", "Diproses via Midtrans. Kami tidak menyimpan data kartu. Cicilan manual, tanpa auto-debit."],
          ["Retensi & hak", "Hubungi admin untuk koreksi/hapus. Anak dengan riwayat pendaftaran tidak bisa dihapus mandiri."],
        ].map(([t, d]) => (
          <Card key={t}><CardPad><h2 className="font-bold text-sm">{t}</h2><p className="mt-2 text-sm text-muted leading-relaxed">{d}</p></CardPad></Card>
        ))}
      </div>
    </Section>
  );
}
