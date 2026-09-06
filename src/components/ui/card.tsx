export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`rounded-[20px] border border-border bg-surface shadow-sm ${className}`}>{children}</div>;
}
export function CardPad({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`p-5 sm:p-6 ${className}`}>{children}</div>;
}
