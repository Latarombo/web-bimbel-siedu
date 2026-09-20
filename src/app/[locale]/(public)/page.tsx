import { getLocale } from 'next-intl/server';
import HeroSection from '@/components/HeroSection';
import TrustIndicators from '@/components/landing/TrustIndicators';
import ServicesCards from '@/components/landing/ServicesCards';
import JenjangCards from '@/components/landing/JenjangCards';
import FeatureSplit from '@/components/landing/FeatureSplit';
import LangkahMemulai from '@/components/landing/LangkahMemulai';
import TestimonialsSection from '@/components/landing/TestimonialsSection';
import FaqSection from '@/components/landing/FaqSection';
import FinalCta from '@/components/landing/FinalCta';
import { collect } from '@/lib/collect';
import { db } from '@/prisma/db';
import { kelasAktifPublik, toKelasKatalog } from '@/lib/kelas';

export const dynamic = 'force-dynamic';

/**
 * Landing page — urutan section mengikuti mockup user:
 * hero (desain user) → 02 Trust Indicators → 03 Services Cards → Pilih
 * Jenjang (14 Sep) → 04 Alternating Feature → Empat langkah memulai
 * (pindahan dari About, 14 Sep) → 06 Testimonials → 07 FAQ → CTA. Katalog
 * kelas dan pengajar dihapus dari landing 14 Sep (kelas tetap via /classes,
 * pengajar via /about). Angka statistik dari DB, termasuk jumlah kelas per
 * jenjang di JenjangCards.
 */
export default async function Landing() {
    const locale = (await getLocale()) === 'en' ? 'en' : 'id';
    const [kelasRows, users, anaks] = await Promise.all([
        kelasAktifPublik(),
        collect(db.orm.public.User.all()),
        collect(db.orm.public.Anak.all()),
    ]);

    const nSiswa = anaks.length;
    const kelasList = kelasRows.map((row) => toKelasKatalog(row, locale));
    const nKelas = kelasList.length;
    const nGuru = users.filter((u) => u.role === 'guru').length;
    const jumlahJenjang = kelasList.reduce(
        (acc, k) => ({ ...acc, [k.jenjang]: (acc[k.jenjang] ?? 0) + 1 }),
        {} as Record<string, number>,
    );

    return (
        <div>
            <HeroSection />
            <TrustIndicators siswa={nSiswa} kelas={nKelas} guru={nGuru} />
            <ServicesCards />
            <JenjangCards counts={jumlahJenjang} />
            <FeatureSplit />
            <LangkahMemulai />
            <TestimonialsSection />
            <FinalCta />
            <FaqSection />
        </div>
    );
}
