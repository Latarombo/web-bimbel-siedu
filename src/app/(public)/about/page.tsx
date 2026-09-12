import Link from "next/link";
import Image from "next/image";
import { Card, CardPad } from "@/components/ui/card";
import { Section, SectionTitle } from "@/components/ui/section";
import TestimonialSection from "@/components/TestimonialTeacher";
import { kelasAktifPublik, toKelasKatalog } from "@/lib/kelas";

export const dynamic = "force-dynamic";

/* Ornamen hero — SVG inline, warna brand (pola Eduvance: squiggle/bintang di gradient) */
function Doodle({ className, kind }: { className: string; kind: "star" | "squiggle" | "cross" }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true" fill="none">
      {kind === "star" && (
        <path d="M20 2l3.6 11.4L35 20l-11.4 3.6L20 35l-3.6-11.4L5 20l11.4-3.6z" fill="currentColor" />
      )}
      {kind === "squiggle" && (
        <path d="M4 26c6-14 10-14 16 0s10 14 16 0" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      )}
      {kind === "cross" && (
        <path d="M8 8l24 24M32 8L8 32" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
      )}
    </svg>
  );
}

export default async function AboutPage() {
  const kelas = (await kelasAktifPublik()).map(toKelasKatalog);
  const guru = new Map<string, Set<string>>();
  for (const k of kelas) {
    if (!guru.has(k.guru)) guru.set(k.guru, new Set());
    guru.get(k.guru)!.add(k.mapel);
  }
  const stats: [string, string][] = [
    [`${kelas.length}`, "Kelas aktif berjalan"],
    [`${guru.size}`, "Pengajar"],
    [`${new Set(kelas.map((k) => k.mapel)).size}`, "Mata pelajaran"],
    [`${new Set(kelas.map((k) => k.jenjang)).size}`, "Jenjang TK–SMA"],
  ];

  return (
    <div>
      {/* 1. HERO — gradient brand + ornamen */}
      <div className="relative overflow-hidden bg-linear-to-br from-brand-strong via-brand to-sky-500 text-white">
        <Doodle kind="squiggle" className="absolute -top-2 right-[12%] w-16 text-amber-300/70 rotate-12" />
        <Doodle kind="star" className="absolute top-24 left-[6%] w-8 text-sky-200/60" />
        <Doodle kind="cross" className="absolute bottom-10 right-[28%] w-7 text-white/25" />
        <Section className="py-16 sm:py-20 text-center">
          <span className="inline-flex items-center rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-medium text-white">Tentang Siedu</span>
          <h1 className="mt-4 text-3xl sm:text-4xl xl:text-5xl font-black tracking-tight leading-[1.05]">
            Belajar dengan tujuan,
            <span className="block text-amber-300">tumbuh bersama Siedu.</span>
          </h1>
          <p className="mt-4 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed text-white/85">
            Kami membangun platform bimbel yang membuat orang tua tenang: pendaftaran rapi, biaya transparan, dan progres anak terlihat real-time.
          </p>
        </Section>
      </div>

      {/* 2. CERITA KAMI — split teks + visual nyata */}
      <Section className="py-14">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <SectionTitle
              kicker="Cerita Kami"
              title={
                <>
                  Jembatan menuju <span className="text-brand">pertumbuhan</span> anak
                </>
              }
            />
            <p className="mt-4 text-sm leading-relaxed text-muted">
              Banyak orang tua berhenti memantau kursus anak karena informasinya tersebar: daftar lewat chat, bayar lewat transfer, progres tidak pernah dilaporkan. Siedu menyatukan semuanya dalam satu platform — dari daftar kelas, pembayaran, presensi, sampai nilai.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              Sistem kami dipakai satu lembaga per instalasi, jadi data anak Anda tidak pernah dicampur dengan pihak lain. Aturan mainnya jelas dan tertulis: kuota dikunci saat daftar, tenggang bayar 7 hari kerja, cicilan selalu manual tanpa auto-debit.
            </p>
          </div>
          <div className="relative">
            <Card className="overflow-hidden">
              <Image src="/images/hero-illustration.png" alt="Ilustrasi anak belajar" width={800} height={520} className="w-full h-auto" priority />
            </Card>
            <Doodle kind="star" className="absolute -top-4 -right-3 w-9 text-amber-400" />
          </div>
        </div>
      </Section>

      {/* 3. STATISTIK — angka dari DB, bukan ketokan */}
      <div className="bg-white border-y border-border">
        <Section className="py-10">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 text-center">
            {stats.map(([a, b]) => (
              <div key={b}>
                <p className="text-3xl font-black tabular-nums text-foreground">{a}</p>
                <p className="mt-1 text-xs text-muted">{b}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>

      {/* 4. VISI & MISI */}
      <Section className="py-14">
        <div className="grid lg:grid-cols-2 gap-10">
          <SectionTitle
            kicker="Visi & Misi"
            title={
              <>
                Tujuan dan arah <span className="text-brand">kerja kami</span>
              </>
            }
            desc="Visi: setiap anak mendapat pembelajaran terstruktur yang progresnya bisa dipertanggungjawabkan ke orang tuanya."
          />
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-foreground">Misi kami</h3>
              <ul className="mt-3 list-disc pl-5 text-sm text-muted space-y-2 leading-relaxed">
                <li>Pendaftaran transparan: kuota real-time, biaya terlihat sejak awal, tanpa biaya tersembunyi.</li>
                <li>Pembayaran aman: lunas atau DP + cicilan manual, tenggang jelas, refund sesuai aturan yang dipublikasikan.</li>
                <li>Pantau progres: presensi dan nilai diinput guru, langsung terlihat orang tua.</li>
                <li>Privasi anak dijaga: data hanya untuk lembaga Anda, consent orang tua wajib sebelum lanjut.</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold text-foreground">Prinsip operasional</h3>
              <ul className="mt-3 list-disc pl-5 text-sm text-muted space-y-1 leading-relaxed">
                <li>Notifikasi email best-effort, tidak memblokir transaksi.</li>
                <li>Kuota dikunci per transaksi — tidak ada kelas yang kelebihan murid.</li>
                <li>Koreksi nilai/presensi lama lewat alur resmi, bukan edit diam-diam.</li>
              </ul>
            </div>
          </div>
        </div>
      </Section>

      {/* 5. PENGAJAR — TestimonialTeacher (desain user, self-contained section) */}
      <TestimonialSection />

      {/* 6. UNTUK SIAPA — kartu peran */}
      <Section className="py-14">
        <SectionTitle kicker="Untuk Siapa" title="Satu platform, tiga peran" />
        <div className="mt-8 grid md:grid-cols-3 gap-4">
          {[
            ["Untuk orang tua", "Kelola banyak anak dalam satu akun, daftar kelas sesuai jenjang, bayar lunas atau DP + cicilan manual, lihat riwayat & status."],
            ["Untuk guru", "Input presensi & nilai. Edit bebas 7 hari, setelah itu via koreksi admin."],
            ["Untuk admin", "Kelola mapel, periode, guru, dan kelas; pantau pendaftaran, refund, dan laporan."],
          ].map(([t, d]) => (
            <Card key={t}>
              <CardPad>
                <h3 className="font-bold text-foreground">{t}</h3>
                <p className="mt-2 text-sm text-muted leading-relaxed">{d}</p>
              </CardPad>
            </Card>
          ))}
        </div>
      </Section>

      {/* 7. CTA */}
      <Section className="pb-14">
        <div className="relative overflow-hidden rounded-3xl bg-linear-to-br from-brand-strong via-brand to-sky-500 text-white p-8 sm:p-10 text-center">
          <Doodle kind="squiggle" className="absolute -bottom-2 left-[8%] w-14 text-amber-300/60" />
          <Doodle kind="star" className="absolute top-4 right-[10%] w-8 text-white/30" />
          <p className="text-xl sm:text-2xl font-black">Siap melihat kelas untuk anak Anda?</p>
          <p className="mt-2 text-sm text-white/85">Buat akun orang tua, lengkapi profil anak, dan amankan kuota kelas incaran.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="rounded-full bg-white text-brand px-6 py-2.5 text-sm font-semibold hover:bg-slate-100">Daftar sekarang</Link>
            <Link href="/classes" className="rounded-full border border-white/30 px-6 py-2.5 text-sm font-semibold hover:bg-white/10">Lihat kelas</Link>
          </div>
        </div>
      </Section>
    </div>
  );
}
