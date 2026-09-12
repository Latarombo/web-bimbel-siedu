/* Badge — DESIGN.md Status Badge: pill, caption 12px, variant per semantik. */
export function Badge({ children, tone = "slate" }: { children: React.ReactNode; tone?: "slate" | "brand" | "amber" | "emerald" | "red" }) {
  const map = {
    slate: "bg-slate-100 text-slate-700 border-slate-200",
    brand: "bg-blue-100 text-blue-800 border-blue-200",
    amber: "bg-amber-100 text-amber-800 border-amber-200",
    emerald: "bg-emerald-100 text-emerald-800 border-emerald-200",
    red: "bg-rose-100 text-rose-800 border-rose-200",
  } as const;
  return <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-medium ${map[tone]}`}>{children}</span>;
}
