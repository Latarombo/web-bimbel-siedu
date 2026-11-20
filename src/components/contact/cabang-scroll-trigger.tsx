"use client";

import { useTranslations } from "next-intl";

import { ArrowDown } from "lucide-react";

export function CabangScrollTrigger({ className }: { className?: string } = {}) {
  const t = useTranslations("public");

  function handleClick(e: React.MouseEvent<HTMLButtonElement>) {
    e.preventDefault();
    const el = document.getElementById("peta-lokasi");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    // Kirim event untuk memicu auto-focus & highlight search box di PetaCabangExplorer
    window.dispatchEvent(new CustomEvent("siedu:focus-cabang-search"));
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className={
        className ??
        "inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-brand hover:text-brand-strong hover:underline transition-colors cursor-pointer"
      }
    >
      <span>{t("cabangViewOffice")}</span>
      <ArrowDown className="size-3.5" />
    </button>
  );
}
