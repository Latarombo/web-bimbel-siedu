import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

/* Input — DESIGN.md: white bg, border slate-200, radius 8px (rounded-lg), height 48px (py-3), focus blue-600. */
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ className, children, required, ...props }: LabelProps) {
  return (
    <label
      className={cn("block text-sm font-semibold text-slate-700 mb-1.5", className)}
      {...props}
    >
      {children}
      {required ? (
        <span className="text-danger font-bold ml-0.5" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}

export function Field({ label, hint, error, children, required }: { label: string; hint?: string; error?: string; children: React.ReactNode; required?: boolean }) {
  return (
    <div>
      <Label required={required}>{label}</Label>
      <div>{children}</div>
      {hint && !error ? <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">{hint}</p> : null}
      {error ? <p className="mt-1.5 text-xs font-medium text-danger" role="alert">{error}</p> : null}
    </div>
  );
}

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: "sm" | "md";
}

export function Input({ className, size = "md", ...props }: InputProps) {
  const isSm = size === "sm";
  return (
    <input
      {...props}
      className={cn(
        "w-full rounded-xl border border-border bg-white text-foreground outline-none transition-colors placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-50 disabled:pointer-events-none",
        isSm ? "h-8.5 px-3 text-xs font-medium" : "h-11 px-3.5 text-base sm:text-sm",
        className
      )}
    />
  );
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  size?: "sm" | "md";
}

export function Select({ className, size = "md", ...props }: SelectProps) {
  const isSm = size === "sm";
  return (
    <div className="relative w-full">
      <select
        {...props}
        className={cn(
          "w-full rounded-xl border border-border bg-white text-foreground outline-none transition-colors appearance-none cursor-pointer placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/15 disabled:opacity-50 disabled:pointer-events-none",
          isSm ? "h-8.5 px-3 pr-8 text-xs font-medium" : "h-11 px-3.5 pr-10 text-base sm:text-sm",
          className
        )}
      />
      <ChevronDown
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400",
          isSm ? "right-2.5 size-3.5" : "right-3.5 size-4"
        )}
        aria-hidden="true"
      />
    </div>
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        "w-full rounded-xl border border-border bg-white px-3.5 py-2.5 text-base text-foreground outline-none transition-colors placeholder:text-slate-400 focus:border-brand focus:ring-2 focus:ring-brand/15 sm:text-sm resize-y disabled:opacity-50 disabled:pointer-events-none",
        props.className
      )}
    />
  );
}
