import { getTranslations } from "next-intl/server";
/**
 * Section "Empat langkah memulai" — dipindah dari About ke landing
 * (14 Sep, permintaan user) persis seperti aslinya: panggung putih,
 * heading tengah, tab folder (isi + interaksi dari components/about/
 * LangkahTabs, tidak di-fork).
 */
import LangkahTabs from "@/components/about/LangkahTabs";

export default async function LangkahMemulai() {
 const tr = await getTranslations("public");
  return (
    <section className="bg-white">
      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            {tr("text91")}<span className="text-brand">{tr("text92")}</span>
          </h2>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">
            {tr("text93")}</p>
        </div>
        <div className="mt-10">
          <LangkahTabs />
        </div>
      </div>
    </section>
  );
}
