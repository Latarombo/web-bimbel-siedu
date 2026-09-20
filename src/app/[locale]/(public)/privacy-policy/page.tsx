import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { Section } from '@/components/ui/section';
import { BlokHukumView } from '@/components/ui/legal-block';
import { TableOfContents } from '@/components/ui/table-of-contents';
import { getPrivasi } from '@/lib/privacy-policy';

export default async function PrivacyPage() {
    const tr = await getTranslations('public');
    const { meta: PRIVASI_META, sections: PRIVASI_SECTIONS } = getPrivasi(tr);
    return (
        <div className="relative min-h-full bg-slate-50">
            {/* Ambient Lighting Glow: Kombinasi 2 Titik Cahaya Diagonal yang Pas & Bersih */}
            <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
                {/* Cahaya utama di pojok kanan atas: Biru Siedu + Sky */}
                <div
                    className="absolute -top-24 -right-24 size-[650px] rounded-full bg-gradient-to-bl from-blue-500/20 via-sky-400/15 to-transparent blur-[110px]"
                />
                {/* Cahaya penyeimbang di sisi kiri bawah: Indigo lembut */}
                <div
                    className="absolute -bottom-32 -left-32 size-[600px] rounded-full bg-indigo-500/15 blur-[120px]"
                />
            </div>

            <Section className="relative z-10 py-12 lg:py-16">
            <header className="max-w-2xl">
                <h1 className="text-3xl font-black leading-[1.15] tracking-tight text-balance text-foreground sm:text-4xl">
                    {PRIVASI_META.judul}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-relaxed text-body sm:text-base">
                    {PRIVASI_META.ringkasan}
                </p>
                <p className="mt-4 text-xs text-muted">
                    {tr('text308')}
                    {PRIVASI_META.diperbarui} {tr('text309')}
                    {PRIVASI_META.waktuBaca} ·{' '}
                    <Link
                        href="/terms"
                        className="font-medium text-brand hover:text-brand-strong"
                    >
                        {tr('text312')}
                    </Link>
                </p>
            </header>

            <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-14">
                <TableOfContents
                    title={tr('text314')}
                    sections={PRIVASI_SECTIONS.map((s) => ({ id: s.id, judul: s.judul }))}
                />

                <article className="max-w-prose">
                    <div className="space-y-10">
                        {PRIVASI_SECTIONS.map((s) => (
                            <section
                                key={s.id}
                                id={s.id}
                                className="scroll-mt-24"
                            >
                                <h2 className="text-xl font-bold leading-snug tracking-tight text-foreground">
                                    {s.judul}
                                </h2>
                                <div className="mt-4 space-y-4 text-base leading-7 text-body">
                                    {s.blok.map((b, i) => (
                                        <BlokHukumView key={i} blok={b} />
                                    ))}
                                </div>
                            </section>
                        ))}
                    </div>
                </article>
            </div>
        </Section>
        </div>
    );
}
