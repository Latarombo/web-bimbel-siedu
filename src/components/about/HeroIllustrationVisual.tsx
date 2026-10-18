"use client";

import React from "react";
import Image from "next/image";
import { motion, useReducedMotion } from "motion/react";

interface HeroIllustrationVisualProps {
  photoAlt?: string;
  className?: string;
}

export default function HeroIllustrationVisual({
  photoAlt = "Ilustrasi platform Siedu",
  className = "",
}: HeroIllustrationVisualProps) {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={`relative mx-auto w-full max-w-[320px] sm:max-w-[380px] md:max-w-[420px] lg:max-w-[460px] xl:max-w-[520px] 2xl:max-w-[560px] ${className}`}
    >
      {/* Efek Radial: Concentric Orbit Rings + Vivid Luminous Glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 flex items-center justify-center select-none"
      >
        {/* 1. Latar Belakang Pendaran Radial Kuat & Terang (Breathing Pulse) */}
        <motion.div
          animate={
            shouldReduceMotion
              ? undefined
              : { scale: [1, 1.05, 1], opacity: [0.85, 1, 0.85] }
          }
          transition={
            shouldReduceMotion
              ? undefined
              : { duration: 5, repeat: Infinity, ease: "easeInOut" }
          }
          className="absolute inset-0 flex items-center justify-center will-change-transform"
        >
          <div className="absolute w-[96%] sm:w-[100%] aspect-square rounded-full bg-[radial-gradient(circle,rgba(37,99,235,0.55)_0%,rgba(96,165,250,0.35)_40%,transparent_70%)] blur-2xl sm:blur-3xl" />
          <div className="absolute -bottom-4 -right-4 w-[65%] aspect-square rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.45)_0%,rgba(251,191,36,0.20)_45%,transparent_70%)] blur-2xl sm:blur-3xl" />
        </motion.div>

        {/* 2. Piringan Latar Halus (Backdrop Disk) agar kontras di atas latar putih murni */}
        <div className="absolute w-[74%] sm:w-[78%] aspect-square rounded-full bg-gradient-to-tr from-blue-100/70 via-sky-50/40 to-blue-50/60" />

        {/* 3. Cincin Konsentris Dalam (Solid Ring — Rotasi Searah Jarum Jam ~52s) */}
        <motion.div
          animate={shouldReduceMotion ? undefined : { rotate: 360 }}
          transition={
            shouldReduceMotion
              ? undefined
              : { duration: 52, repeat: Infinity, ease: "linear" }
          }
          className="absolute w-[78%] sm:w-[82%] aspect-square rounded-full border-2 border-blue-500/70 shadow-[0_0_28px_rgba(37,99,235,0.25)] will-change-transform"
        >
          {/* Satelit 1 (Kiri Atas ~10:00): Biru Brand dengan Cincin Biru Tegas */}
          <span className="absolute top-[12%] left-[8%] flex size-4 sm:size-5 items-center justify-center rounded-full bg-blue-600 border-2 border-white ring-2 sm:ring-4 ring-blue-500 shadow-md shadow-blue-600/45">
            <span className="size-1 sm:size-1.5 rounded-full bg-white" />
          </span>

          {/* Satelit 2 (Kanan Atas ~2:00): Aksen Amber Emas dengan Cincin Amber Tegas */}
          <span className="absolute top-[18%] right-[6%] flex size-3.5 sm:size-4.5 items-center justify-center rounded-full bg-amber-500 border-2 border-white ring-2 sm:ring-4 ring-amber-400 shadow-md shadow-amber-500/40">
            <span className="size-1 rounded-full bg-white" />
          </span>

          {/* Satelit 3 (Kiri Bawah ~7:30): Sky Blue dengan Cincin Sky Blue */}
          <span className="absolute bottom-[14%] left-[16%] size-3 sm:size-4 rounded-full bg-sky-400 border-2 border-white ring-2 sm:ring-4 ring-sky-400 shadow-sm shadow-sky-400/40" />
        </motion.div>

        {/* 4. Cincin Konsentris Luar (Dashed Orbit Ring — Rotasi Berlawanan Arah Jarum Jam ~68s) */}
        <motion.div
          animate={shouldReduceMotion ? undefined : { rotate: -360 }}
          transition={
            shouldReduceMotion
              ? undefined
              : { duration: 68, repeat: Infinity, ease: "linear" }
          }
          className="absolute w-[98%] sm:w-[102%] aspect-square rounded-full border-2 border-dashed border-blue-400/65 shadow-[0_0_35px_rgba(59,130,246,0.15)] will-change-transform"
        >
          {/* Satelit 4 (Kanan Tengah ~3:30): Amber Utama — Terbuka bebas tidak tertutup gambar */}
          <span className="absolute top-[56%] -right-1.5 sm:-right-2.5 flex size-4.5 sm:size-5.5 items-center justify-center rounded-full bg-amber-500 border-2 border-white ring-2 sm:ring-4 ring-amber-400 shadow-md shadow-amber-500/50">
            <span className="size-1 sm:size-1.5 rounded-full bg-white" />
          </span>

          {/* Satelit 5 (Kiri Tengah ~9:00): Biru Brand dengan Cincin Biru Tegas */}
          <span className="absolute top-[46%] -left-1.5 sm:-left-2 size-3.5 sm:size-4.5 rounded-full bg-blue-600 border-2 border-white ring-2 sm:ring-4 ring-blue-500 shadow-sm shadow-blue-600/40" />

          {/* Satelit 6 (Atas Tengah ~12:30): Cyan Cerah dengan Cincin Cyan */}
          <span className="absolute -top-1.5 sm:-top-2 left-[54%] size-3 sm:size-4 rounded-full bg-cyan-400 border-2 border-white ring-2 sm:ring-4 ring-cyan-400 shadow-sm shadow-cyan-400/40" />
        </motion.div>
      </div>

      {/* Ilustrasi Utama — Melayang Lembut (Levitation ~4.5s) */}
      <motion.div
        animate={shouldReduceMotion ? undefined : { y: [0, -8, 0] }}
        transition={
          shouldReduceMotion
            ? undefined
            : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
        }
        className="relative z-10 w-full will-change-transform"
      >
        <Image
          src="/images/about_hero_ilustration.png"
          alt={photoAlt}
          width={1000}
          height={1086}
          priority
          className="h-auto w-full object-contain select-none drop-shadow-[0_12px_24px_rgba(15,23,42,0.08)]"
          sizes="(min-width: 1536px) 560px, (min-width: 1280px) 520px, (min-width: 1024px) 460px, (min-width: 640px) 400px, 90vw"
        />
      </motion.div>
    </div>
  );
}
