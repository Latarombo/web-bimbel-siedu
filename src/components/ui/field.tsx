/* Input — DESIGN.md: white bg, border slate-200, radius 8px (rounded-lg), height 48px (py-3), focus blue-600. */
export function Field({ label, hint, error, children, required }: { label: string; hint?: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label} {required ? <span className="text-danger">*</span> : null}</span>
      <div className="mt-1.5">{children}</div>
      {hint && !error ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
      {error ? <p className="mt-1.5 text-xs font-medium text-danger" role="alert">{error}</p> : null}
    </label>
  );
}

const inputBase = "w-full rounded-lg border border-border bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-brand focus:ring-2 focus:ring-brand/15 transition-colors placeholder:text-slate-400";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`${inputBase} resize-y ${props.className ?? ""}`} />;
}
