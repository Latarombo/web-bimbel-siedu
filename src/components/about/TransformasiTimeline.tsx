"use client";

import React, { useEffect, useRef, useState } from "react";
import { useScroll, useTransform, motion } from "motion/react";
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

export default function TransformasiTimeline({
  titleBefore,
  titleHighlight,
  lead,
  kicker,
  rows,
}: TransformasiTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const updateHeight = () => {
      if (ref.current) {
        const rect = ref.current.getBoundingClientRect();
        setHeight(rect.height);
      }
    };

    updateHeight();
    window.addEventListener("resize", updateHeight);

    const resizeObserver = new ResizeObserver(() => {
      updateHeight();
    });
    if (ref.current) {
      resizeObserver.observe(ref.current);
    }

    return () => {
      window.removeEventListener("resize", updateHeight);
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
      className="relative w-full border-y border-slate-100 bg-slate-50/70 py-16 sm:py-24 lg:py-32"
    >
      {/* Container utama menyamakan persis padding Section halaman (max-w-7xl px-4 sm:px-6 lg:px-8) */}
      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header Section — lurus rata kiri dengan grid konten */}
        <div className="max-w-2xl mb-12 sm:mb-16 lg:mb-20">
          <p className="text-xs font-bold uppercase tracking-widest text-blue-600 mb-3">
            {kicker}
          </p>
          <h2 className="text-balance text-2xl font-black leading-[1.15] tracking-tight text-[#0f235f] sm:text-3xl lg:text-4xl">
            {titleBefore}{" "}
            <span className="text-blue-600">{titleHighlight}</span>
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-slate-500 sm:text-base">
            {lead}
          </p>
        </div>

        {/* Timeline Container — batas kiri & kanan lurus dengan header */}
        <div ref={ref} className="relative pb-12">
          {rows.map((item, index) => (
            <div
              key={index}
              className="flex justify-start pt-10 md:pt-18 lg:pt-20 md:gap-8 lg:gap-12 first:pt-0"
            >
              {/* Sticky Node & Aspek Label di Desktop */}
              <div className="sticky flex flex-col md:flex-row z-30 items-center top-36 sm:top-40 self-start w-auto md:w-56 lg:w-64 shrink-0">
                {/* Dot Circle: left-0 di container, size-9 (36px) sm:size-10 (40px) */}
                <div className="absolute left-0 size-9 sm:size-10 rounded-full bg-white flex items-center justify-center border border-slate-200 shadow-xs ring-4 ring-slate-100/90">
                  <div className="size-3.5 sm:size-4 rounded-full bg-blue-600 shadow-xs" />
                </div>

                {/* Aspek Label Desktop — lurus setelah node */}
                <div className="hidden md:block md:pl-14 lg:md:pl-16">
                  <span className="text-xs font-bold uppercase tracking-widest text-blue-600">
                    Aspek {index + 1}
                  </span>
                  <h3 className="text-lg lg:text-xl font-black tracking-tight text-[#0f235f] mt-0.5">
                    {item.aspek}
                  </h3>
                </div>
              </div>

              {/* Content Column: di mobile pl-13 agar tidak menabrak dot di left-0 */}
              <div className="relative pl-13 sm:pl-14 md:pl-0 w-full min-w-0">
                {/* Aspek Label Mobile */}
                <div className="md:hidden mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                    Aspek {index + 1} &bull; {item.aspek}
                  </span>
                </div>

                {/* Clean Comparison Content */}
                <div className="space-y-5 sm:space-y-6 pb-12 sm:pb-16 border-b border-slate-200/70 last:border-b-0">
                  {/* Cara lama */}
                  <div className="group flex items-start gap-3 sm:gap-4">
                    <span
                      aria-hidden="true"
                      className="mt-1 flex size-5 sm:size-6 shrink-0 items-center justify-center rounded-full bg-slate-200/80 text-slate-400"
                    >
                      <X className="size-3 sm:size-3.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                        Cara lama
                      </span>
                      <p className="mt-1 text-base font-medium leading-relaxed text-slate-400 line-through decoration-slate-300 sm:text-lg lg:text-xl">
                        {item.lama}
                      </p>
                    </div>
                  </div>

                  {/* Siedu */}
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span
                      aria-hidden="true"
                      className="mt-1 flex size-5 sm:size-6 shrink-0 items-center justify-center rounded-full bg-blue-100 text-blue-600"
                    >
                      <Check className="size-3 sm:size-3.5 stroke-[3]" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <span className="text-xs font-bold uppercase tracking-wider text-blue-600">
                        Siedu
                      </span>
                      <div className="mt-1 flex items-start gap-2.5 sm:gap-3">
                        <ArrowRight className="mt-1 size-4 sm:size-5 shrink-0 text-amber-500" aria-hidden="true" />
                        <p className="text-lg font-black leading-snug tracking-tight text-[#0f235f] sm:text-xl lg:text-2xl xl:text-[1.75rem]">
                          {item.baru}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
