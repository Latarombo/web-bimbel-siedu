"use client";
import { useTranslations } from "next-intl";


/**
 * Island karusel testimoni orang tua.
 *
 * 13 Sep (revisi 3): kartu melaju TERUS-MENERUS, tidak per kartu lagi
 * (interval step 4,5 dtk terasa patah-patah). Rel berisi dua set kartu
 * identik; begitu offset melewati satu lebar set, ia di-wrap mundur
 * persis selebar set — putaran tampak tanpa batas: kartu habis = berulang
 * ulang, tanpa lompatan visual.
 *
 * Kontrol (WCAG 2.2.2 — gerak otomatis >5 dtk wajib bisa dijeda):
 * - jeda otomatis selama hover, fokus keyboard, atau sedang drag;
 * - prefers-reduced-motion: animasi dimatikan, rel jadi scroll manual.
 * (Tombol jeda/putar dihapus 13 Sep atas permintaan user — jeda lewat hover.)
 *
 * Geser tangan tetap bisa: drag mouse/pen dan swipe sentuh menggeser
 * offset (loop ikut ter-wrap); panah keyboard memajukan/mundur satu kartu.
 */
import { useEffect, useRef, useState } from "react";
import { Quote, Star } from "lucide-react";
import { cn } from "@/lib/utils";

const KECEPATAN = 55; // px per detik (±8 dtk per kartu 400px)
const GAP = 20; // selisih antar kartu/set, kelas gap-5

export type Testimoni = {
  nama: string;
  peran: string;
  foto: string;
  kutip: string;
};

function Kartu({ t, hiasan }: { t: Testimoni; hiasan?: boolean }) {
  return (
    <article
      aria-hidden={hiasan || undefined}
      className="group relative flex w-[min(84vw,400px)] shrink-0 flex-col justify-between overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-xs transition-all duration-300 hover:-translate-y-1 hover:border-brand/40 hover:shadow-md select-none"
    >
      <div className="relative">
        {/* Baris Atas: 5 Bintang Emas & Ikon Petik Dua Lucide */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star key={i} className="size-4 fill-amber-400 text-amber-400" />
            ))}
          </div>
          <Quote
            className="size-6 text-brand/30 transition-colors duration-300 group-hover:text-brand shrink-0"
            strokeWidth={2}
            aria-hidden="true"
          />
        </div>

        {/* Teks Kutipan Testimoni */}
        <p className="mt-4 text-sm font-medium leading-relaxed text-slate-700">
          &ldquo;{t.kutip}&rdquo;
        </p>
      </div>

      {/* Profil Orang Tua di Bawah (Pemisah Halus) */}
      <div className="relative mt-5 flex items-center gap-3 border-t border-slate-100 pt-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={t.foto}
          alt={hiasan ? "" : t.nama}
          draggable={false}
          className="size-11 rounded-full object-cover ring-2 ring-slate-100 shadow-2xs shrink-0"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-extrabold text-slate-900 leading-snug truncate">
            {t.nama}
          </p>
          <p className="text-xs font-medium text-slate-500 mt-0.5 truncate">
            {t.peran}
          </p>
        </div>
      </div>
    </article>
  );
}

export default function TestimonialCarousel({ items }: { items: Testimoni[] }) {
 const tr = useTranslations("public");
  const relRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLDivElement>(null);
  const offset = useRef(0); // posisi rel (px, negatif = maju)
  const drag = useRef({ id: -1, lastX: 0 });
  // satu-satunya sumber kebenaran untuk rAF; diubah HANYA di event handler
  const jeda = useRef({ hover: false, drag: false });
  const [dragging, setDragging] = useState(false);
  const [gerak, setGerak] = useState(false); // false s/d matchMedia selesai

  const oles = () => {
    const el = relRef.current;
    if (el) el.style.transform = `translate3d(${offset.current}px,0,0)`;
  };

  /** Bungkus offset agar selalu di rentang (-selebar, 0]. */
  const norm = (o: number, selebar: number) => {
    let x = o;
    while (x > 0) x -= selebar;
    while (x <= -selebar) x += selebar;
    return x;
  };

  // Deteksi preferensi gerak lewat listener (bukan setState sinkron di effect)
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const terapkan = () => setGerak(!mq.matches);
    terapkan();
    mq.addEventListener("change", terapkan);
    return () => mq.removeEventListener("change", terapkan);
  }, []);

  useEffect(() => {
    if (!gerak) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      // dt dibatasi: saat tab kembali dari background, jangan lompat jauh
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const set = setRef.current;
      const j = jeda.current;
      if (set && !j.hover && !j.drag) {
        const selebar = set.getBoundingClientRect().width + GAP;
        offset.current = norm(offset.current - KECEPATAN * dt, selebar);
        oles();
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gerak]);

  const nudge = (dir: 1 | -1) => {
    const set = setRef.current;
    if (!set) return;
    const selebar = set.getBoundingClientRect().width + GAP;
    const kartu = (set.querySelector("article")?.getBoundingClientRect().width ?? 400) + GAP;
    offset.current = norm(offset.current + (dir === 1 ? -kartu : kartu), selebar);
    oles();
  };

  const tahan = (key: "hover" | "drag", v: boolean) => {
    jeda.current[key] = v;
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!gerak || e.button !== 0) return;
    drag.current = { id: e.pointerId, lastX: e.clientX };
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
    tahan("drag", true);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (d.id !== e.pointerId) return;
    const set = setRef.current;
    if (!set) return;
    const selebar = set.getBoundingClientRect().width + GAP;
    offset.current = norm(offset.current + (e.clientX - d.lastX), selebar);
    d.lastX = e.clientX;
    oles();
  };
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    if (drag.current.id !== e.pointerId) return;
    drag.current.id = -1;
    setDragging(false);
    tahan("drag", false);
  };

  return (
    <div className="mt-10">
      <div
        role="group"
        aria-roledescription={tr("text106")}
        aria-label={tr("text107")}
        tabIndex={0}
        onMouseEnter={() => tahan("hover", true)}
        onMouseLeave={() => {
          if (drag.current.id === -1) tahan("hover", false);
        }}
        onFocusCapture={() => tahan("hover", true)}
        onBlurCapture={() => {
          if (drag.current.id === -1) tahan("hover", false);
        }}
        onKeyDown={(e) => {
          if (e.key === "ArrowRight") {
            e.preventDefault();
            nudge(1);
          } else if (e.key === "ArrowLeft") {
            e.preventDefault();
            nudge(-1);
          }
        }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        style={{ touchAction: gerak ? "pan-y" : undefined }}
        className={cn(
          "carousel-fade overflow-hidden pb-2 pt-1 outline-offset-4",
          !gerak && "no-scrollbar overflow-x-auto",
          gerak && (dragging ? "cursor-grabbing select-none" : "cursor-grab"),
        )}
      >
        {/* Rel = dua set identik; set kedua (hiasan) bikin loop tanpa putus */}
        <div ref={relRef} className={cn("flex gap-5", gerak && "will-change-transform")}>
          <div ref={setRef} className="flex shrink-0 gap-5">
            {items.map((t) => (
              <Kartu key={`a-${t.nama}`} t={t} />
            ))}
          </div>
          <div className="flex shrink-0 gap-5">
            {items.map((t) => (
              <Kartu hiasan key={`b-${t.nama}`} t={t} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
