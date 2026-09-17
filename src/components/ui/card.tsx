/* Kartu harga — flat sesuai DESIGN.md (radius 16px, border slate-100, shadow-1). */
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-2xl border border-slate-100 bg-surface shadow-sm ${className}`}>{children}</div>;
}
export function CardPad({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-4 sm:p-6 ${className}`}>{children}</div>;
}
