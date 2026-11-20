/**
 * HeroRain — efek hujan garis tipis di dalam frame hero (meniru garis jatuh
 * pada hero bimbelnurulfikri.id / Dark Grid Hero hover.dev).
 *
 * Lokasi horizontal pakai `left` + `width` persen → relatif ke frame.
 * Jarak jatuh keyframe pakai vh → selalu melewati tinggi frame di breakpoint
 * apa pun (translate persen relatif ke tinggi garisnya sendiri, bukan frame).
 *
 * Posisi, panjang, kecepatan, dan opacity digenerate dari seeded PRNG
 * (bukan Math.random) supaya hasil server = hasil client — tanpa
 * hydration mismatch.
 */

// PRNG mulberry32 — deterministik, ringan.
function prng(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const DROPS = 12;

const drops = (() => {
  const r = prng(20260915);
  return Array.from({ length: DROPS }, (_, i) => ({
    id: i,
    left: +(r() * 100).toFixed(2), // % lebar frame
    width: +(2.2 + r() * 1.8).toFixed(2), // px — garis lebih tebal
    height: +(26 + r() * 30).toFixed(1), // px — garis lebih panjang
    dur: +(4.5 + r() * 3).toFixed(2), // s — jatuh pelan
    delay: +(-r() * 7.5).toFixed(2), // s — negatif: langsung terisi
    op: +(0.55 + r() * 0.4).toFixed(2), // jelas terlihat
  }));
})();

export default function HeroRain() {
  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden
    >
      {drops.map((d) => (
        <span
          key={d.id}
          className="hero-rain-drop absolute top-0 rounded-full bg-gradient-to-b from-transparent via-blue-300/95 to-white motion-reduce:hidden"
          style={{
            left: `${d.left}%`,
            width: `${d.width}px`,
            height: `${d.height}px`,
            opacity: d.op,
            animation: `hero-rain ${d.dur}s linear infinite`,
            animationDelay: `${d.delay}s`,
          }}
        />
      ))}
    </div>
  );
}
