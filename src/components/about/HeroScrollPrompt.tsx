"use client";

import React from "react";
import { motion, useScroll, useTransform } from "motion/react";
import { ChevronDown } from "lucide-react";

interface HeroScrollPromptProps {
  text: string;
  targetId?: string;
  className?: string;
}

export default function HeroScrollPrompt({
  text,
  targetId = "evolusi",
  className = "",
}: HeroScrollPromptProps) {
  const { scrollY } = useScroll();

  // Memudar secara halus saat pengguna mulai scroll ke bawah (0px -> 140px)
  const opacity = useTransform(scrollY, [0, 140], [1, 0]);
  const y = useTransform(scrollY, [0, 140], [0, 14]);
  const pointerEvents = useTransform(scrollY, (val) => (val > 120 ? "none" : "auto"));

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      window.location.hash = targetId;
    }
  };

  return (
    <motion.div
      style={{ opacity, y, pointerEvents }}
      className={`hidden lg:flex fixed bottom-5 sm:bottom-6 left-1/2 -translate-x-1/2 z-30 justify-center ${className}`}
    >
      <a
        href={`#${targetId}`}
        onClick={handleClick}
        aria-label={text}
        className="group flex flex-col items-center gap-2 select-none cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 rounded-xl p-1"
      >
        {/* Teks label interaktif */}
        <span className="text-xs sm:text-sm font-semibold tracking-normal text-muted transition-colors duration-200 group-hover:text-brand">
          {text}
        </span>

        {/* Indikator Mouse Scroll Kapsul Modern + Chevron */}
        <div className="flex flex-col items-center transition-transform duration-200 group-hover:translate-y-1">
          {/* Badan Mouse Kapsul */}
          <div className="relative flex h-9 w-[22px] justify-center rounded-full border-2 border-slate-300 bg-white/95 pt-1.5 shadow-xs transition-all duration-300 ease-out group-hover:border-brand group-hover:bg-blue-50/50 group-hover:shadow-md group-hover:shadow-blue-500/15 group-hover:ring-4 group-hover:ring-blue-100">
            {/* Roda Mouse (Scroll Dot) yang meluncur turun secara kontinyu */}
            <motion.div
              animate={{
                y: [0, 10, 10],
                opacity: [1, 1, 0],
              }}
              transition={{
                repeat: Infinity,
                duration: 1.6,
                ease: "easeInOut",
                times: [0, 0.6, 1],
              }}
              className="h-2 w-1 rounded-full bg-brand shadow-xs motion-reduce:transform-none"
            />
          </div>

          {/* Chevron penunjuk arah ke bawah yang berdenyut halus */}
          <motion.div
            animate={{
              y: [0, 3, 0],
              opacity: [0.4, 0.9, 0.4],
            }}
            transition={{
              repeat: Infinity,
              duration: 1.6,
              ease: "easeInOut",
            }}
            className="mt-1 text-slate-400 transition-colors duration-200 group-hover:text-brand motion-reduce:transform-none"
          >
            <ChevronDown className="size-3.5 stroke-[2.5]" />
          </motion.div>
        </div>
      </a>
    </motion.div>
  );
}
