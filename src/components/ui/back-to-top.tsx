"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

interface BackToTopProps {
  label?: string;
}

export function BackToTop({ label = "Kembali ke Atas" }: BackToTopProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Tampilkan tombol saat scroll melebihi 400px
      if (window.scrollY > 400) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (!isVisible) return null;

  return (
    <button
      type="button"
      onClick={scrollToTop}
      aria-label={label}
      title={label}
      className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-border bg-white/95 px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-md backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-brand hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 dark:bg-slate-900/95 dark:text-slate-200 dark:border-slate-800"
    >
      <ArrowUp className="size-4 text-brand" />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
