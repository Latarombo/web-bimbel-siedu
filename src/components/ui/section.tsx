export function Section({ children, className = "", id }: { children: React.ReactNode; className?: string; id?: string }) {
  return <section id={id} className={`mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 ${className}`}>{children}</section>;
}
export function SectionTitle({ kicker, title, desc }: { kicker?: string; title: React.ReactNode; desc?: string }) {
  return (
    <div className="max-w-2xl text-balance">
      {kicker ? <p className="text-xs font-semibold text-brand">{kicker}</p> : null}
      <h2 className="mt-2 text-2xl sm:text-3xl font-bold tracking-tight text-foreground">{title}</h2>
      {desc ? <p className="mt-3 text-sm leading-relaxed text-muted">{desc}</p> : null}
    </div>
  );
}
