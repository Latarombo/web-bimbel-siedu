export function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "brand" | "amber" | "emerald" | "red" }) {
  const map = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    brand: "bg-brand-soft text-brand border-blue-100",
    amber: "bg-amber-50 text-amber-800 border-amber-200",
    emerald: "bg-emerald-50 text-emerald-800 border-emerald-200",
    red: "bg-red-50 text-red-700 border-red-200",
  } as const;
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold ${map[tone]}`}>{children}</span>;
}
