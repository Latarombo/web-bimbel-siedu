import Link from "next/link";
import { Section, SectionTitle } from "@/components/ui/section";
import { Card, CardPad } from "@/components/ui/card";
import HeroSection from "@/components/HeroSection";
import { KelasGrid } from "@/components/kelas-card";
import { kelasAktifPublik, toKelasKatalog, type JenjangKatalog } from "@/lib/kelas";

export const dynamic = "force-dynamic";

export default async function Landing() {
  const kelas = (await kelasAktifPublik()).map(toKelasKatalog);
  const nJenjang = new Set(kelas.map((k) => k.jenjang)).size;
  const stats: [string, string][] = [
    [`${nJenjang} jenjang`, "TK · SD · SMP · SMA"],
    [`${kelas.length} kelas aktif`, "Periode berjalan"],
    ["DP atau lunas", "Cicilan manual, bukan auto-debit"],
    ["Presensi & nilai", "Guru input, orang tua pantau"],
  ];

  return (
    <div>
      {/* HERO — komponen user HeroSection.tsx (sementara), wire href ke route nyata */}
      <HeroSection />

      {/* STATS — angka dari DB, bukan ketokan */}
      <Section className="py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map(([a, b]) => (
            <div key={a} className="rounded-2xl border border-border bg-white px-4 py-4">
              <p className="text-sm font-bold">{a}</p>
              <p className="text-xs text-muted mt-1">{b}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* PROGRAM */}
      <Section className="py-6">
        <SectionTitle kicker="Program" title="Pilih sesuai jenjang anak" desc="Kelas disesuaikan dengan jenjang anak. Lengkapi profil anak dulu sebelum pilih kelas." />
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {([
            { j: "TK", d: "Calistung & fondasi", accent: "bg-amber-50 border-amber-200" },
            { j: "SD", d: "Matematika & bahasa", accent: "bg-blue-50 border-blue-200" },
            { j: "SMP", d: "Fisika, Matematika", accent: "bg-emerald-50 border-emerald-200" },
            { j: "SMA", d: "UTBK & pendalaman", accent: "bg-violet-50 border-violet-200" },
          ] as { j: JenjangKatalog; d: string; accent: string }[]).map((x) => (
            <Link key={x.j} href={`/classes?jenjang=${x.j}`} className={`rounded-[20px] border p-5 hover:shadow-sm transition-shadow ${x.accent}`}>
              <p className="text-lg font-black">{x.j}</p>
              <p className="text-xs text-muted mt-1">{x.d}</p>
              <p className="text-xs font-semibold mt-3">Lihat kelas {x.j} →</p>
            </Link>
          ))}
        </div>
      </Section>

      {/* KELAS UNGGULAN */}
      <Section className="py-10">
        <div className="flex items-end justify-between gap-4">
          <SectionTitle kicker="Katalog" title="Kelas unggulan" desc="Biaya transparan sejak awal. Kelas dengan opsi DP bisa dicicil manual; tanpa opsi DP hanya lunas." />
          <Link href="/classes" className="hidden sm:inline-flex text-sm font-semibold text-brand hover:underline">Semua kelas →</Link>
        </div>
        <div className="mt-6">
          <KelasGrid items={kelas} />
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <div className="bg-slate-900 text-white">
        <Section className="py-12">
          <h2 className="text-2xl font-bold tracking-tight">Cara daftar — 3 langkah</h2>
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {[
              ["1", "Daftar & lengkapi profil anak", "Buat akun orang tua, setujui 2 persetujuan, lalu tambah anak: nama, tanggal lahir, jenjang."],
              ["2", "Pilih kelas & metode bayar", "Kelas disesuaikan dengan jenjang anak. Pilih lunas atau DP + cicilan (kalau tersedia). Kuota langsung dikunci saat daftar."],
              ["3", "Bayar & pantau", "Bayar via Midtrans. Pantau status pembayaran, presensi, dan nilai anak."],
            ].map(([n, t, d]) => (
              <div key={n} className="rounded-[20px] bg-white/5 border border-white/10 p-6">
                <p className="w-8 h-8 grid place-items-center rounded-full bg-white text-slate-900 text-sm font-black">{n}</p>
                <p className="mt-4 font-semibold">{t}</p>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{d}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* FAQ */}
      <Section className="py-10" id="faq">
        <SectionTitle kicker="FAQ" title="Pertanyaan umum" />
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          {[
            ["Apakah cicilan auto-debit?", "Tidak. Cicilan manual — orang tua klik Bayar tiap jatuh tempo. Tidak ada penarikan otomatis."],
            ["Bagaimana kalau telat bayar?", "Ada tenggang 7 hari kerja, lalu pendaftaran bisa dibatalkan karena tunggakan. Cicilan kartu/BNPL pihak ketiga dimatikan."],
            ["Kelas penuh?", "Kuota langsung dikunci saat daftar. Tanpa bayar 24 jam, pendaftaran batal otomatis dan kuota dibuka kembali."],
            ["Bisa edit presensi lama?", "Guru bisa edit bebas 7 hari, setelah itu lewat pengajuan koreksi ke admin."],
          ].map(([q, a]) => (
            <Card key={q}><CardPad><p className="text-sm font-semibold">{q}</p><p className="text-sm text-muted mt-2 leading-relaxed">{a}</p></CardPad></Card>
          ))}
        </div>
      </Section>

      {/* CTA */}
      <Section className="pb-12">
        <div className="rounded-[24px] bg-brand text-white p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <p className="text-lg font-bold">Siap daftar?</p>
            <p className="text-sm text-white/80">Buat akun orang tua, tambah profil anak, dan amankan kuota kelas incaran.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/register" className="rounded-full bg-white text-brand px-6 py-2.5 text-sm font-semibold hover:bg-slate-100">Daftar sekarang</Link>
            <Link href="/classes" className="rounded-full border border-white/30 px-6 py-2.5 text-sm font-semibold hover:bg-white/10">Lihat kelas</Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
