export function Field({ label, hint, error, children, required }: { label: string; hint?: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label} {required ? <span className="text-red-600">*</span> : null}</span>
      <div className="mt-1.5">{children}</div>
      {hint && !error ? <p className="mt-1.5 text-xs text-muted">{hint}</p> : null}
      {error ? <p className="mt-1.5 text-xs font-medium text-red-600" role="alert">{error}</p> : null}
    </label>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand placeholder:text-slate-400 ${props.className ?? ""}`} />;
}
export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select {...props} className={`w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand ${props.className ?? ""}`} />;
}
export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea {...props} className={`w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-sm outline-none focus:border-brand ${props.className ?? ""}`} />;
}
