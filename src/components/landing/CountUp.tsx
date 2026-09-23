"use client";

/**
 * CountUp — angka naik dari 0 ke nilai target saat pertama kali masuk
 * viewport (pola statistik Dicoding): IntersectionObserver + rAF +
 * ease-out cubic, ~1,6 detik, hanya sekali. Format id-ID (ribuan = titik),
 * desimal dijaga (4.8 tidak sempat tampil "4"). Pengunjung dengan
 * prefers-reduced-motion langsung melihat nilai akhir.
 */
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";

export default function CountUp({
  value,
  decimals = 0,
  className,
}: {
  value: number;
  decimals?: number;
  className?: string;
}) {
  const locale = useLocale();
  const ref = useRef<HTMLSpanElement>(null);
  const done = useRef(false);
  const [tampil, setTampil] = useState(0);

  const fmt = new Intl.NumberFormat(locale === "en" ? "en-US" : "id-ID", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting || done.current) return;
        done.current = true;
        io.disconnect();
        const dur = 1600;
        const t0 = performance.now();
        const tick = (now: number) => {
          const p = Math.min((now - t0) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          setTampil(eased * value);
          if (p < 1) requestAnimationFrame(tick);
          else setTampil(value);
        };
        requestAnimationFrame(tick);
      },
      { threshold: 0.4 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [value]);

  const reducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  return (
    <span ref={ref} className={className}>
      {fmt.format(reducedMotion ? value : tampil)}
    </span>
  );
}
