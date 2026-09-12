/* Card — DESIGN.md Base Card: white, border slate-100/200, radius 16px (rounded-2xl), shadow-1. */
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-100 bg-surface shadow-sm ${className}`}>{children}</div>;
}
export function CardPad({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-6 ${className}`}>{children}</div>;
}
