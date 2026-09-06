import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardPad } from "@/components/ui/card";
import { Section, SectionTitle } from "@/components/ui/section";
import { KelasGrid } from "@/components/kelas-card";
import { KELAS } from "@/lib/placeholder";

export default function Landing() {
  return (
    <div>
      {/* HERO */}
      <div className="bg-white border-b border-border">
        <Section className="py-10 sm:py-14">
          <div className="grid lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <Badge tone="brand">Pendaftaran bimbel TK–SMA · orang tua sebagai penanggung jawab</Badge>
              <h1 className="mt-4 text-3xl sm:text-[42px] font-black tracking-tight leading-[0.95]">
                Bimbel yang rapi
                <span className="block text-brand">dari daftar sampai nilai.</span>
              </h1>
              <p className="mt-4 text-[15px] leading-relaxed text-muted max-w-xl">
                Siedu kelola pendaftaran, kuota real-time, pembayaran lunas atau DP + cicilan manual, serta presensi & progres anak — transparan untuk orang tua, ringan untuk admin & guru.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/classes" className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white hover:bg-blue-700">Lihat kelas</Link>
                <Link href="/register" className="inline-flex items-center justify-center rounded-full border border-border bg-white px-6 py-3 text-sm font-semibold hover:border-foreground">Daftar sebagai orang tua</Link>
              </div>
              <div className="mt-6 flex flex-wrap gap-2 text-xs text-muted">
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Kuota terkunci transaksi (BR#1)</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-amber-500" /> Timeout 24 jam (BR#2)</span>
                <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-brand" /> Cicilan manual (BR#24)</span>
              </div>
            </div>

            {/* Visual — single orchestrated card, not scattered gradients */}
            <div className="lg:col-span-5">
              <Card className="overflow-hidden">
                <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
                  <p className="text-sm font-semibold">Jadwal minggu ini</p>
                  <span className="text-xs px-2 py-1 rounded-full bg-white/15">Periode 2026/2027 Ganjil</span>
                </div>
                <CardPad className="space-y-3">
                  {KELAS.slice(0,3).map((k) => (
                    <div key={k.id} className="flex items-center justify-between rounded-2xl border border-border px-4 py-3">
                      <div>
                        <p className="text-sm font-semibold">{k.mapel}</p>
                        <p className="text-xs text-muted">{k.hari} {k.jam} · {k.guru}</p>
                      </div>
                      <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-soft text-brand border border-blue-100">{k.jenjang}</span>
                    </div>
                  ))}
                  <Link href="/classes" className="block text-center text-sm font-semibold text-brand hover:underline">Lihat katalog lengkap →</Link>
                </CardPad>
              </Card>
            </div>
          </div>
        </Section>
      </div>

      {/* STATS — quiet row */}
      <Section className="py-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            ["4 jenjang", "TK · SD · SMP · SMA"],
            ["6 kelas aktif", "Periode berjalan"],
            ["DP atau lunas", "Cicilan manual, bukan auto-debit"],
            ["Presensi & nilai", "Guru input, orang tua pantau"],
          ].map(([a,b]) => (
            <div key={a} className="rounded-2xl border border-border bg-white px-4 py-4">
              <p className="text-sm font-bold">{a}</p>
              <p className="text-xs text-muted mt-1">{b}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* PROGRAM */}
      <Section className="py-6">
        <SectionTitle kicker="Program" title="Pilih sesuai jenjang anak" desc="Filter kelas mengikuti jenjang terakhir anak (BR#13). Kalau belum diisi, sistem minta lengkapi dulu sebelum pilih kelas." />
        <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { j: "TK", d: "Calistung & fondasi", accent: "bg-amber-50 border-amber-200" },
            { j: "SD", d: "Matematika & bahasa", accent: "bg-blue-50 border-blue-200" },
            { j: "SMP", d: "Fisika, Matematika", accent: "bg-emerald-50 border-emerald-200" },
            { j: "SMA", d: "UTBK & pendalaman", accent: "bg-violet-50 border-violet-200" },
          ].map((x) => (
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
          <SectionTitle kicker="Katalog" title="Kelas unggulan" desc="Biaya transparan. Kelas dengan biaya DP mendukung skema DP + cicilan; tanpa DP hanya lunas (BR#12)." />
          <Link href="/classes" className="hidden sm:inline-flex text-sm font-semibold text-brand hover:underline">Semua kelas →</Link>
        </div>
        <div className="mt-6">
          <KelasGrid items={KELAS} />
        </div>
      </Section>

      {/* HOW IT WORKS */}
      <div className="bg-slate-900 text-white">
        <Section className="py-12">
          <h2 className="text-2xl font-bold tracking-tight">Cara daftar — 3 langkah</h2>
          <div className="mt-8 grid md:grid-cols-3 gap-6">
            {[
              ["1", "Daftar & lengkapi profil anak", "Akun orang tua + 2 consent (BR#25). Tambah anak: nama, tanggal lahir, jenjang."],
              ["2", "Pilih kelas & metode bayar", "Kelas difilter jenjang anak. Pilih lunas atau DP + cicilan (kalau tersedia). Kuota terkunci saat submit."],
              ["3", "Bayar & pantau", "Bayar via Midtrans (BR#23: kanal cicilan BNPL dimatikan). Pantau status, presensi, dan nilai."],
            ].map(([n,t,d]) => (
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
            ["Apakah cicilan auto-debit?", "Tidak. BR#24: cicilan manual — orang tua klik Bayar tiap jatuh tempo. Tidak ada penarikan otomatis."],
            ["Bagaimana kalau telat bayar?", "Tenggang 7 hari kerja (BR#4), lalu dibatalkan_tunggakan (BR#7). Kanal BNPL pihak ketiga dimatikan (BR#23)."],
            ["Kelas penuh?", "Kuota dikunci row-level lock (BR#1). Timeout 24 jam tanpa bayar → dibatalkan_timeout & kuota dilepas (BR#11)."],
            ["Bisa edit presensi lama?", "Guru edit bebas 7 hari (BR#18), setelah itu via pengajuan koreksi ke admin."],
          ].map(([q,a]) => (
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
