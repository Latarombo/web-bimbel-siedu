import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardPad } from "@/components/ui/card";
import { KELAS, rupiah, type KelasCard } from "@/lib/placeholder";

export function KelasCardView({ k }: { k: KelasCard }) {
  const pct = Math.round((k.kuota.terisi / k.kuota.maksimum) * 100);
  const hampir = pct >= 85;
  return (
    <Card className="overflow-hidden flex flex-col hover:shadow-md transition-shadow">
      <div className="h-1.5 w-full" style={{ background: k.jenjang === "TK" ? "#F59E0B" : k.jenjang === "SD" ? "#1D4ED8" : k.jenjang === "SMP" ? "#10B981" : "#7C3AED" }} />
      <CardPad className="flex-1 flex flex-col gap-3">
        <div className="flex items-start justify-between gap-3">
          <Badge tone={k.jenjang === "TK" ? "amber" : k.jenjang === "SD" ? "brand" : "emerald"}>{k.jenjang}</Badge>
          <span className={`text-xs font-semibold ${hampir ? "text-amber-700" : "text-muted"}`}>{k.kuota.terisi}/{k.kuota.maksimum} terisi</span>
        </div>
        <h3 className="text-[16px] font-bold leading-tight">{k.mapel}</h3>
        <p className="text-xs text-muted">{k.periode} · {k.guru}</p>
        <p className="text-sm text-foreground">{k.hari} · {k.jam}</p>
        <div className="mt-1 flex items-baseline gap-2">
          <span className="text-sm font-bold">{rupiah(k.biayaPeriode)}</span>
          <span className="text-xs text-muted">/ periode</span>
        </div>
        {k.biayaDp !== null ? <p className="text-xs text-muted">DP {rupiah(k.biayaDp)} + cicilan manual (BR#24)</p> : <p className="text-xs text-muted">Hanya lunas (tanpa DP)</p>}
        <div className="mt-auto pt-2 flex gap-2">
          <Link href={`/classes/${k.id}`} className="flex-1 text-center text-sm font-semibold py-2.5 rounded-full border border-border hover:border-foreground transition-colors">Detail</Link>
          <Link href={`/register`} className="flex-1 text-center text-sm font-semibold py-2.5 rounded-full bg-brand text-white hover:bg-blue-700 transition-colors">Daftar</Link>
        </div>
      </CardPad>
    </Card>
  );
}

export function KelasGrid({ items }: { items: typeof KELAS }) {
  if (items.length === 0) return <p className="text-sm text-muted py-8 text-center border border-dashed border-border rounded-2xl">Tidak ada kelas untuk filter ini.</p>;
  return <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">{items.map((k) => <KelasCardView key={k.id} k={k} />)}</div>;
}
