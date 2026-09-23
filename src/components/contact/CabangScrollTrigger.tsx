"use client";

import { useTranslations } from "next-intl";

export function CabangScrollTrigger() {
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
      className="mt-1 inline-flex items-center font-bold text-brand hover:text-brand-dark hover:underline transition-colors text-sm cursor-pointer"
    >
      <span>{t("cabangViewOffice")}</span>
    </button>
  );
}
