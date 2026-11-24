import React from "react";

interface WhatsAppStoryRingProps {
  /** Jumlah status/story aktif */
  count: number;
  /** Jumlah status yang sudah dilihat (0..count) */
  viewedCount?: number;
  /** Ukuran diameter luar ring dalam pixel (default: 56) */
  size?: number;
  /** Ketebalan garis ring dalam pixel (default: 2.5) */
  strokeWidth?: number;
  /** Jarak celah antar segmen dalam pixel (default: 3) */
  gap?: number;
  /** Elemen avatar di dalam ring */
  children: React.ReactNode;
  /** Kelas CSS tambahan untuk wrapper */
  className?: string;
}

/**
 * Komponen cincin status WhatsApp SVG yang presisi:
 * - count === 0: Lingkaran polos / abu-abu transparan.
 * - count === 1: Lingkaran penuh (hijau jika belum dilihat, abu-abu jika sudah dilihat).
 * - count > 1: Lingkaran bersegmen terpisah (segmented arcs), persis seperti WhatsApp Status.
 */
export function WhatsAppStoryRing({
  count,
  viewedCount = 0,
  size = 56,
  strokeWidth = 2.5,
  gap = 3.5,
  children,
  className = "",
}: WhatsAppStoryRingProps) {
  // Jika tidak ada status aktif, render avatar polos tanpa ring
  if (count <= 0) {
    return (
      <div className={`relative inline-flex items-center justify-center shrink-0 ${className}`}>
        {children}
      </div>
    );
  }

  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Single status: lingkaran mulus 360 derajat
  if (count === 1) {
    const isViewed = viewedCount >= 1;
    return (
      <div
        className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <svg
          width={size}
          height={size}
          className="absolute inset-0 pointer-events-none -rotate-90"
          aria-hidden="true"
        >
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            className={
              isViewed
                ? "stroke-slate-300 dark:stroke-slate-600 transition-colors"
                : "stroke-emerald-500 transition-colors"
            }
          />
        </svg>
        <div className="relative z-10 flex items-center justify-center">
          {children}
        </div>
      </div>
    );
  }

  // Multi-status: lingkaran bersegmen (segmented arcs)
  const segmentLength = (circumference - count * gap) / count;
  const step = segmentLength + gap;

  return (
    <div
      className={`relative inline-flex items-center justify-center shrink-0 ${className}`}
      style={{ width: size, height: size }}
    >
      <svg
        width={size}
        height={size}
        className="absolute inset-0 pointer-events-none -rotate-90"
        aria-hidden="true"
      >
        {Array.from({ length: count }).map((_, idx) => {
          // Segmen yang sudah dilihat diberi warna muted gray, yang belum diberi warna emerald
          const isSegmentViewed = idx < viewedCount;
          const offset = -(idx * step) + gap / 2;

          return (
            <circle
              key={idx}
              cx={center}
              cy={center}
              r={radius}
              fill="none"
              strokeWidth={strokeWidth}
              strokeDasharray={`${Math.max(1, segmentLength)} ${circumference - Math.max(1, segmentLength)}`}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className={
                isSegmentViewed
                  ? "stroke-slate-300 dark:stroke-slate-600 transition-colors"
                  : "stroke-emerald-500 transition-colors"
              }
            />
          );
        })}
      </svg>
      <div className="relative z-10 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
}
