import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { Section } from "@/components/ui/section";
import { BlokHukumView } from "@/components/ui/legal-block";
import { getPrivasi } from "@/lib/privacy-policy";

export default async function PrivacyPage() {
 const tr = await getTranslations("public");
 const { meta: PRIVASI_META, sections: PRIVASI_SECTIONS } = getPrivasi(tr);
 return (
 <Section className="py-12 lg:py-16">
 <header className="max-w-2xl">
 <h1 className="text-3xl font-black leading-[1.15] tracking-tight text-balance text-foreground sm:text-4xl">
 {PRIVASI_META.judul}
 </h1>
 <p className="mt-4 max-w-2xl text-sm leading-relaxed text-body sm:text-base">{PRIVASI_META.ringkasan}</p>
 <p className="mt-4 text-xs text-muted">
 {tr("text308")}{PRIVASI_META.diperbarui} {tr("text309")}{PRIVASI_META.waktuBaca} ·{" "}
 <Link href="/terms" className="font-medium text-brand hover:text-brand-strong">{tr("text312")}</Link>
 </p>
 </header>

 <div className="mt-10 grid gap-10 lg:mt-14 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-16">
 <aside className="order-2 lg:order-1 lg:max-w-60">
 <nav aria-label={tr("text313")} className="lg:sticky lg:top-24">
 <div className="rounded-lg border border-border bg-surface p-5">
 <h2 className="text-sm font-bold text-foreground">{tr("text314")}</h2>
 <ol className="mt-4 space-y-2.5 border-t border-border pt-4">
 {PRIVASI_SECTIONS.map((s) => (
 <li key={s.id}>
 <a
 href={`#${s.id}`}
 className="block text-sm leading-snug text-body hover:text-brand-strong hover:underline"
 >
 {s.judul}
 </a>
 </li>
 ))}
 </ol>
 </div>
 </nav>
 </aside>

 <article className="order-1 max-w-prose lg:order-2">
 <div className="space-y-10">
 {PRIVASI_SECTIONS.map((s) => (
 <section key={s.id} id={s.id} className="scroll-mt-24">
 <h2 className="text-xl font-bold leading-snug tracking-tight text-foreground">{s.judul}</h2>
 <div className="mt-4 space-y-4 text-base leading-7 text-body">{s.blok.map((b, i) => <BlokHukumView key={i} blok={b} />)}</div>
 </section>
 ))}
 </div>
 <p className="mt-12 rounded-lg border border-border p-5 text-sm leading-6 text-muted">
 {tr("text315")}</p>
 </article>
 </div>
 </Section>
 );
}
