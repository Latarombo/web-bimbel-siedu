/* Kartu — Living Design System (Modern Clean SaaS: border slate-200/80, shadow-sm, rounded-xl). */
export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-slate-200/80 bg-surface shadow-sm transition-shadow ${className}`}>{children}</div>;
}
export function CardPad({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-5 sm:p-6 ${className}`}>{children}</div>;
}
