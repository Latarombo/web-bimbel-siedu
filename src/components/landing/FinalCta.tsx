import { getTranslations } from 'next-intl/server';
/**
 * Section "Terakhir" — Final CTA (mockup baru: D:\Screenshot 2026-09-14 231316.png,
 * adaptasi layout kartu 2 kolom NF). 14 Sep: diganti dari banner biru full-width
 * jadi kartu putih di panggung biru muda — teks tidak lagi berantem sama grid.
 * - Panggung: #eff5fe, grid + titik tipis biru dengan radial mask (peran latar,
 *   bintangnya sekarang kartunya).
 * - Kartu 2 kolom: kiri heading dua warna + sub + 2 tombol (sekunder "Hubungi
 *   Kami" -> /contact, primer "Daftar Sekarang ->" -> /register, rounded-lg);
 *   kanan foto right-hero.png pop-out memecah tepi atas kartu (overflow terlihat).
 * - Mobile: foto di atas kartu tanpa pop-out (margin negatif cuma lg).
 */
import { Link } from '@/i18n/navigation';
import { ArrowRight } from 'lucide-react';

export default async function FinalCta() {
    const tr = await getTranslations('public');
    return (
        <section className="relative overflow-hidden bg-[#eff5fe]">
            {/* Grid + titik persimpangan tipis — latar saja, dipudar via mask radial */}
            <div
                aria-hidden
                className="absolute inset-0"
                style={{
                    backgroundImage: `
 radial-gradient(circle 2px at center, rgba(37,99,235,0.10) 96%, transparent 100%),
 linear-gradient(to right, rgba(37,99,235,0.08) 1px, transparent 1px),
 linear-gradient(to bottom, rgba(37,99,235,0.08) 1px, transparent 1px)
 `,
                    backgroundSize: '44px 44px, 44px 44px, 44px 44px',
                    backgroundPosition: '22px 22px, 0 0, 0 0',
                    maskImage:
                        'radial-gradient(ellipse 62% 115% at 50% 50%, black 0%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0.15) 82%, transparent 100%)',
                    WebkitMaskImage:
                        'radial-gradient(ellipse 62% 115% at 50% 50%, black 0%, rgba(0,0,0,0.8) 45%, rgba(0,0,0,0.15) 82%, transparent 100%)',
                }}
            />

            {/* max-w-7xl + px-4/sm:px-6/lg:px-8 = sama persis dgn section landing lain
     (Hero, Trust, Services, dst) supaya tepi kiri/kanan kartu lurus. */}
            <div className="relative mx-auto max-w-7xl px-4 pb-20 pt-16 sm:px-6 sm:pb-24 sm:pt-20 lg:px-8 lg:pt-44">
                <div className="relative grid items-center gap-6 rounded-3xl border border-brand-soft bg-white/80 p-6 sm:p-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-stretch lg:gap-4">
                    {/* Kolom kiri — copy */}
                    <div className="order-2 text-center lg:order-1 lg:text-left">
                        <h2 className="text-balance text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-foreground">
                            {tr('text71')}{' '}
                            <span className="text-brand">{tr('text73')}</span>
                        </h2>
                        <p className="mx-auto mt-4 max-w-xl text-sm sm:text-base leading-relaxed text-muted lg:mx-0">
                            {tr('text74')}
                        </p>
                        <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4 lg:justify-start">
                            <Link
                                href="/contact"
                                className="inline-flex items-center justify-center rounded-lg border-2 border-border bg-white px-8 py-3.5 text-sm font-bold text-foreground transition-colors hover:border-gray-300 hover:bg-gray-50"
                            >
                                {tr('text75')}
                            </Link>
                            <Link
                                href="/register"
                                className="inline-flex items-center justify-center gap-2 rounded-lg bg-brand px-8 py-3.5 text-sm font-bold text-white shadow-md transition-colors hover:bg-brand-strong"
                            >
                                {tr('text76')}
                                <ArrowRight className="size-4" />
                            </Link>
                        </div>
                    </div>

                    {/* Kolom kanan — spacer grid HANYA di lg+ (dulu ikut tampil di mobile jadi
     baris kosong + gap 24px antara foto dan teks). Di desktop foto diposisikan
     absolut ke dasar kartu supaya saat diperbesar tumbuhnya KE ATAS (menambah
     pop-out), bukan melebarkan kartu ke bawah (koreksi user 14 Sep). */}
                    <div
                        className="hidden lg:order-2 lg:block lg:min-h-65"
                        aria-hidden="true"
                    />
                    {/* justify-self-center: tanpa ini, di mobile foto rata ke tepi kiri kartu
     (grid item dengan lebar fixed tidak ikut di-stretch). */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src="/images/right-hero.png"
                        alt={tr('text77')}
                        className="order-1 h-auto w-56 justify-self-center object-contain drop-shadow-xl sm:w-64 lg:absolute lg:bottom-[-1px] lg:right-10 lg:order-2 lg:mt-0 lg:w-[380px] lg:max-w-none xl:w-[450px]"
                    />
                </div>
            </div>
        </section>
    );
}
