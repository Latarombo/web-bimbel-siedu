"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  useScroll,
  useTransform,
  useMotionValueEvent,
  motion,
  type MotionValue,
} from "motion/react";
import { ArrowRight, Check, X } from "lucide-react";

interface BandingRow {
  aspek: string;
  lama: string;
  baru: string;
}

interface TransformasiTimelineProps {
  titleBefore: string;
  titleHighlight: string;
  lead: string;
  kicker: string;
  rows: BandingRow[];
}

interface TimelineRowProps {
  item: BandingRow;
  index: number;
  heightTransform: MotionValue<number>;
  targetTop: number;
  dotRef: (el: HTMLDivElement | null) => void;
  isReducedMotion: boolean;
}

function TimelineRow({
  item,
  index,
  heightTransform,
  targetTop,
  dotRef,
  isReducedMotion,
}: TimelineRowProps) {
  const [isActive, setIsActive] = useState(() => {
    return isReducedMotion || (targetTop > 0 && heightTransform.get() >= targetTop);
  });

  useEffect(() => {
    setIsActive(isReducedMotion || (targetTop > 0 && heightTransform.get() >= targetTop));
  }, [targetTop, heightTransform, isReducedMotion]);

  useMotionValueEvent(heightTransform, "change", (latest) => {
    if (isReducedMotion) {
      setIsActive(true);
      return;
    }
    setIsActive(targetTop > 0 && latest >= targetTop);
  });

  return (
    <div className="flex justify-start pt-8 sm:pt-10 md:pt-12 lg:pt-14 md:gap-8 lg:gap-12 first:pt-0">
      {/* Sticky Node & Aspek Label di Desktop */}
      <div className="sticky flex flex-col md:flex-row z-30 items-center top-32 sm:top-36 self-start w-auto md:w-56 lg:w-64 shrink-0">
        {/* Dot Circle: left-0 di container, size-9 (36px) sm:size-10 (40px)
            Sebelum tersentuh garis biru: dot abu-abu (bg-slate-300).
            Setelah tersentuh garis biru: dot berubah menjadi biru (bg-blue-600) + ring glow biru halus + ripple ping */}
        <div
          ref={dotRef}
          className={`absolute left-0 size-9 sm:size-10 rounded-full bg-white flex items-center justify-center border shadow-xs ring-4 transition-all duration-300 ease-out ${
            isActive
              ? "border-blue-400 ring-blue-100/90 shadow-blue-100"
              : "border-slate-200 ring-slate-100/90"
          }`}
        >
          {/* Ripple pulse saat dot aktif */}
          {isActive && !isReducedMotion && (
            <span
              className="pointer-events-none absolute inset-0 rounded-full bg-blue-500/25 animate-ping"
              style={{ animationIterationCount: 1, animationDuration: "0.8s" }}
            />
          )}

          <div
            className={`size-3.5 sm:size-4 rounded-full shadow-xs transition-all duration-300 ease-out ${
              isActive
                ? "bg-blue-600 scale-100 ring-2 ring-blue-400/40"
                : "bg-slate-300 scale-90"
            }`}
          />
        </div>

        {/* Aspek Label Desktop — lurus setelah node */}
        <div className="hidden md:block md:pl-14 lg:md:pl-16">
          <span
            className={`text-xs font-bold uppercase tracking-widest transition-colors duration-300 ${
              isActive ? "text-brand" : "text-muted"
            }`}
          >
            Aspek {index + 1}
          </span>
          <h3 className="text-lg lg:text-xl font-bold tracking-tight text-foreground mt-0.5">
            {item.aspek}
          </h3>
        </div>
      </div>

      {/* Content Column: di mobile pl-13 agar tidak menabrak dot di left-0 */}
      <div className="relative pl-13 sm:pl-14 md:pl-0 w-full min-w-0">
        {/* Aspek Label Mobile */}
        <div className="md:hidden mb-3">
          <span
            className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
              isActive ? "text-brand" : "text-muted"
            }`}
          >
            Aspek {index + 1} &bull; {item.aspek}
          </span>
        </div>

        {/* Comparison Content — Sequential Contrast & Strikethrough Sweep (Frameless & Clean) */}
        <div className="space-y-4 sm:space-y-5 pb-8 sm:pb-10 lg:pb-12 border-b border-slate-200/70 last:border-b-0">
          {/* 1. Cara lama — Ikon persis di samping label, teks rapi di bawahnya */}
          <div className="group transition-all duration-400 ease-out motion-reduce:transition-none">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <span
                aria-hidden="true"
                className={`flex size-5 sm:size-5.5 shrink-0 items-center justify-center rounded-full border transition-all duration-400 ${
                  isActive
                    ? "bg-slate-100 text-slate-400 border-slate-200/60 scale-95"
                    : "bg-rose-50 text-rose-500 border-rose-200/80 scale-100 shadow-2xs shadow-rose-500/5"
                }`}
              >
                <X className="size-3 sm:size-3.5" aria-hidden="true" />
              </span>
              <span
                className={`text-xs font-semibold uppercase tracking-wider transition-colors duration-400 ${
                  isActive ? "text-slate-400" : "text-rose-600/90"
                }`}
              >
                Cara lama
              </span>
            </div>

            <p
              className={`mt-1.5 sm:mt-2 text-base sm:text-lg lg:text-xl font-medium leading-relaxed transition-all duration-500 ease-out line-through ${
                isActive
                  ? "text-slate-400 decoration-rose-400/80 decoration-2"
                  : "text-slate-700 decoration-transparent"
              }`}
            >
              {item.lama}
            </p>
          </div>

          {/* 2. Siedu — Ikon persis di samping label, teks rapi di bawahnya */}
          <div
            className={`transition-all duration-500 ease-out motion-reduce:transition-none motion-reduce:transform-none ${
              isActive
                ? "translate-y-0 opacity-100 delay-100"
                : "translate-y-1.5 opacity-40 hover:opacity-75"
            }`}
          >
            <div className="flex items-center gap-2 sm:gap-2.5">
              <span
                aria-hidden="true"
                className={`flex size-5 sm:size-5.5 shrink-0 items-center justify-center rounded-full transition-all duration-500 ${
                  isActive
                    ? "bg-blue-100 text-brand ring-4 ring-blue-100/90 shadow-sm shadow-blue-500/10 scale-100"
                    : "bg-slate-100 text-slate-400 scale-90 ring-0"
                }`}
              >
                <Check className="size-3 sm:size-3.5 stroke-[3]" aria-hidden="true" />
              </span>
              <span
                className={`text-xs font-bold uppercase tracking-wider transition-colors duration-300 ${
                  isActive ? "text-brand" : "text-slate-400"
                }`}
              >
                Siedu
              </span>
            </div>

            {/* Teks Penjelas: dengan tanda panah kuning/amber beranimasi maju */}
            <div className="mt-1.5 sm:mt-2 flex items-start gap-2.5 sm:gap-3">
              <ArrowRight
                className={`mt-1 size-4 sm:size-5 shrink-0 text-amber-500 transition-all duration-300 ${
                  isActive ? "translate-x-1 opacity-100" : "translate-x-0 opacity-50"
                }`}
                aria-hidden="true"
              />
              <p
                className={`text-base sm:text-lg lg:text-xl font-bold leading-snug tracking-tight transition-colors duration-300 ${
                  isActive ? "text-foreground" : "text-slate-400"
                }`}
              >
                {item.baru}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TransformasiTimeline({
  titleBefore,
  titleHighlight,
  lead,
  kicker,
  rows,
}: TransformasiTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const dotRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [height, setHeight] = useState(0);
  const [dotTops, setDotTops] = useState<number[]>([]);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsReducedMotion(window.matchMedia("(prefers-reduced-motion: reduce)").matches);
    }
  }, []);

  useEffect(() => {
    const updateMeasurements = () => {
      if (ref.current) {
        const containerRect = ref.current.getBoundingClientRect();
        setHeight(containerRect.height);

        const tops = dotRefs.current.map((dotEl) => {
          if (!dotEl || !ref.current) return 0;
          let offsetTop = 0;
          let curr: HTMLElement | null = dotEl;
          while (curr && curr !== ref.current) {
            offsetTop += curr.offsetTop;
            curr = curr.offsetParent as HTMLElement | null;
          }
          // Titik sentuh: saat garis biru menyentuh bagian atas/tengah dot
          return offsetTop > 0 ? offsetTop + 6 : dotEl.getBoundingClientRect().top - containerRect.top + 6;
        });
        setDotTops(tops);
      }
    };

    updateMeasurements();
    window.addEventListener("resize", updateMeasurements);

    const resizeObserver = new ResizeObserver(() => {
      updateMeasurements();
    });
    if (ref.current) {
      resizeObserver.observe(ref.current);
    }

    return () => {
      window.removeEventListener("resize", updateMeasurements);
      resizeObserver.disconnect();
    };
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 20%", "end 75%"],
  });

  const heightTransform = useTransform(scrollYProgress, [0, 1], [0, height]);
  const opacityTransform = useTransform(scrollYProgress, [0, 0.05], [0, 1]);

  return (
    <div
      id="evolusi"
      ref={containerRef}
      className="relative w-full border-y border-slate-100 bg-slate-50/70 py-14 sm:py-18 lg:py-24"
    >
      {/* Container utama menyamakan persis padding Section halaman (max-w-7xl px-4 sm:px-6 lg:px-8) */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Section — lurus rata kiri dengan grid konten */}
        <div className="max-w-2xl mb-10 sm:mb-12 lg:mb-14">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand mb-2.5">
            {kicker}
          </p>
          <h2 className="text-balance text-3xl sm:text-4xl font-bold leading-[1.15] tracking-tight text-foreground">
            {titleBefore}{" "}
            <span className="text-brand">{titleHighlight}</span>
          </h2>
          <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted">
            {lead}
          </p>
        </div>

        {/* Timeline Container — batas kiri & kanan lurus dengan header */}
        <div ref={ref} className="relative pb-12">
          {rows.map((item, index) => (
            <TimelineRow
              key={index}
              item={item}
              index={index}
              heightTransform={heightTransform}
              targetTop={dotTops[index] || 0}
              dotRef={(el) => {
                dotRefs.current[index] = el;
              }}
              isReducedMotion={isReducedMotion}
            />
          ))}

          {/* Vertical Timeline Guide & Animated Scroll Line:
              left-[17px] di mobile (center size-9 = 18px), sm:left-[19px] (center size-10 = 20px) */}
          <div
            style={{ height: height > 0 ? `${height}px` : "100%" }}
            className="absolute left-[17px] sm:left-[19px] top-0 w-[2px] overflow-hidden bg-gradient-to-b from-transparent via-slate-300 to-transparent [mask-image:linear-gradient(to_bottom,transparent_0%,black_10%,black_90%,transparent_100%)]"
          >
            {/* Animated beam filling on scroll */}
            <motion.div
              style={{
                height: heightTransform,
                opacity: opacityTransform,
              }}
              className="absolute inset-x-0 top-0 w-[2px] rounded-full bg-gradient-to-t from-blue-600 via-sky-400 to-transparent shadow-[0_0_12px_rgba(37,99,235,0.8)] motion-reduce:hidden"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
