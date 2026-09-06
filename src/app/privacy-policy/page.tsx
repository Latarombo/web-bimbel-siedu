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
          ["Consent (BR#25)", "Saat registrasi orang tua mencentang 2 consent: (a) setuju kebijakan privasi, (b) menyatakan sebagai wali sah anak. Timestamp disimpan (privasi_disetujui_at, wali_disetujui_at)."],
          ["Penggunaan data", "Untuk pendaftaran kelas, verifikasi kuota, penagihan, presensi/nilai, dan notifikasi status. Email_notifikasi anak hanya untuk notifikasi, tidak pernah untuk autentikasi."],
          ["Pembayaran", "Diproses via Midtrans Snap. Kanal cicilan kartu/BNPL dinonaktifkan (BR#23). Cicilan manual (BR#24). Kami tidak menyimpan data kartu."],
          ["Retensi & hak", "Hubungi admin untuk koreksi/hapus. Anak dengan riwayat pendaftaran tidak bisa dihapus mandiri."],
        ].map(([t, d]) => (
          <Card key={t}><CardPad><h2 className="font-bold text-sm">{t}</h2><p className="mt-2 text-sm text-muted leading-relaxed">{d}</p></CardPad></Card>
        ))}
      </div>
    </Section>
  );
}
