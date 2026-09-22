import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

/**
 * Final CTA Section — Coursera-inspired banner
 * - Container: Soft blue tint (#ebf3ff) card with clean border and rounded-3xl.
 * - Left column: Strong dark navy heading with brand blue accent, descriptive copy, and Coursera-style dual CTA buttons.
 * - Right column: Student photo (/images/right-hero.png) grounded cleanly at the bottom edge.
 */
export default async function FinalCta() {
    const tr = await getTranslations('public');

    return (
        <section className="relative overflow-hidden bg-white pt-24 pb-12 sm:pt-28 sm:pb-14 lg:pt-36 lg:pb-16">
            <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                {/* Coursera-style Soft Blue Card Container — Ringkas & Proporsional */}
                <div className="relative rounded-2xl border border-blue-200/70 bg-gradient-to-br from-[#ebf3ff] via-[#f2f7ff] to-[#e6f0ff] px-6 pt-8 pb-0 sm:px-8 sm:pt-10 sm:pb-0 lg:px-12 lg:py-12 xl:px-16 shadow-sm">
                    {/* Efek melengkung ribbon khas Coursera di sisi kanan — digeser lebih ke kanan */}
                    <div
                        aria-hidden="true"
                        className="pointer-events-none absolute right-0 top-0 bottom-0 w-72 sm:w-80 lg:w-[380px] xl:w-[420px] overflow-hidden rounded-r-2xl"
                    >
                        <svg
                            className="size-full translate-x-10 sm:translate-x-14"
                            viewBox="0 0 500 300"
                            fill="none"
                            preserveAspectRatio="none"
                            xmlns="http://www.w3.org/2000/svg"
                        >
                            <path
                                d="M 215 -20 C 220 40, 250 80, 315 75 C 375 70, 415 30, 450 30 C 480 30, 483 75, 470 125 C 455 170, 430 205, 385 235 C 330 265, 255 260, 205 270 C 165 280, 140 295, 120 325"
                                stroke="#5b94e2"
                                strokeWidth="36"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="opacity-85"
                            />
                        </svg>
                    </div>

                    {/* Desktop Student Photo — Di sebelah KIRI, layer atas (z-20), menempel pas di dasar banner (bottom-0), membesar keluar ke atas 30% */}
                    <div className="pointer-events-none absolute bottom-0 left-6 z-20 hidden lg:block lg:w-[350px] xl:left-10 xl:w-[390px]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/images/right-hero.png"
                            alt={tr('text77')}
                            className="block h-auto w-full object-contain object-bottom drop-shadow-[0_16px_32px_rgba(37,99,235,0.14)]"
                        />
                    </div>

                    {/* Right Column — Heading, Copy & Action Buttons */}
                    <div className="relative z-10 text-center lg:ml-[340px] xl:ml-[380px] lg:text-left">
                        <h2 className="text-balance text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl lg:text-[1.85rem] lg:leading-tight">
                            {tr('text71')}{' '}
                            <span className="text-brand">{tr('text73')}</span>
                        </h2>

                        <p className="mx-auto mt-2.5 max-w-md text-sm leading-relaxed text-slate-600 sm:text-base lg:mx-0">
                            {tr('text74')}
                        </p>

                        <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row lg:justify-start">
                            <Link
                                href="/register"
                                className="inline-flex items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all duration-200 hover:bg-brand-strong hover:shadow active:scale-[0.98]"
                            >
                                <span>{tr('text76')}</span>
                            </Link>
                            <Link
                                href="/contact"
                                className="inline-flex items-center justify-center rounded-lg border-2 border-brand bg-white px-5 py-2.5 text-sm font-semibold text-brand shadow-sm transition-all duration-200 hover:bg-brand-soft/40 hover:border-brand-strong active:scale-[0.98]"
                            >
                                {tr('text75')}
                            </Link>
                        </div>
                    </div>

                    {/* Mobile Student Photo — Layer atas (z-20), menempel pas di dasar banner tanpa celah */}
                    <div className="relative z-20 mt-6 flex justify-center lg:hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src="/images/right-hero.png"
                            alt={tr('text77')}
                            className="block h-52 sm:h-64 w-auto object-contain object-bottom drop-shadow-[0_10px_20px_rgba(37,99,235,0.12)]"
                        />
                    </div>
                </div>
            </div>
        </section>
    );
}
