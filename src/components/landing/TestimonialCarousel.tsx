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

const KARTU = "#d7f2fe";
const KECEPATAN = 55; // px per detik (±8 dtk per kartu 440px)
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
      className="relative w-[min(84vw,420px)] shrink-0 rounded-2xl p-6 shadow-sm ring-1 ring-foreground/5"
      style={{ backgroundColor: KARTU }}
    >
      <Quote className="absolute right-6 top-5 size-8 text-slate-400/40" fill="currentColor" />
      <div className="flex items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={t.foto}
          alt={hiasan ? "" : t.nama}
          draggable={false}
          className="size-12 rounded-full object-cover"
        />
        <div>
          <p className="text-sm font-bold text-foreground">{t.nama}</p>
          <p className="text-xs text-muted">{t.peran}</p>
        </div>
      </div>
      <div className="mt-4 flex gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="size-4 fill-accent text-accent" />
        ))}
      </div>
      <p className="mt-3 text-sm italic leading-relaxed text-body">{`"${t.kutip}"`}</p>
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
    const kartu = (set.querySelector("article")?.getBoundingClientRect().width ?? 420) + GAP;
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
