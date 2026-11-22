"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

const FieldContext = React.createContext<{
  id: string;
  errorId: string;
  hintId: string;
  hasError: boolean;
  hasHint: boolean;
} | null>(null);

/* Label — Siedu DESIGN.md: semibold, slate-800, cursor-pointer */
export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ className, children, required, htmlFor, ...props }: LabelProps) {
  const ctx = React.useContext(FieldContext);
  const targetId = htmlFor ?? ctx?.id;
  return (
    <label
      htmlFor={targetId}
      className={cn("block text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2 cursor-pointer", className)}
      {...props}
    >
      {children}
      {required ? (
        <span className="text-rose-600 font-bold ml-0.5" aria-hidden="true">
          *
        </span>
      ) : null}
    </label>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
  required,
  id: explicitId,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
  id?: string;
}) {
  const generatedId = React.useId();
  const id = explicitId ?? generatedId;
  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  return (
    <FieldContext.Provider
      value={{
        id,
        errorId,
        hintId,
        hasError: Boolean(error),
        hasHint: Boolean(hint),
      }}
    >
      <div>
        <Label required={required} htmlFor={id}>
          {label}
        </Label>
        <div>{children}</div>
        {hint && !error ? (
          <p id={hintId} className="mt-2 text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
            {hint}
          </p>
        ) : null}
        {error ? (
          <p id={errorId} className="mt-2 text-xs font-medium text-rose-600 dark:text-rose-400" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    </FieldContext.Provider>
  );
}

export interface InputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size"> {
  size?: "sm" | "md";
}

/* Input — Siedu DESIGN.md & Web Interface Guidelines:
   - Anti-zoom iPhone: text-base sm:text-sm (>=16px on mobile)
   - Border 3:1 contrast at rest: border-slate-300 dark:border-slate-600
   - Real focus ring: focus-visible:ring-2 focus-visible:ring-brand/20 focus-visible:border-brand
   - Standard radius: rounded-lg (10px)
   - Mobile touch target: h-11 sm:h-10 (44px mobile, 40px desktop)
*/
export function Input({ className, size = "md", id, "aria-describedby": ariaDescribedby, ...props }: InputProps) {
  const ctx = React.useContext(FieldContext);
  const resolvedId = id ?? ctx?.id;
  const isSm = size === "sm";

  const resolvedDescribedBy =
    ariaDescribedby ??
    (ctx?.hasError ? ctx.errorId : ctx?.hasHint ? ctx.hintId : undefined);

  return (
    <input
      id={resolvedId}
      aria-describedby={resolvedDescribedBy}
      aria-invalid={ctx?.hasError || undefined}
      {...props}
      className={cn(
        "w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-500 focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 disabled:opacity-50 disabled:pointer-events-none",
        isSm ? "h-9 px-3 text-sm font-medium" : "h-11 sm:h-10 px-3 sm:px-4 text-base sm:text-sm",
        ctx?.hasError && "border-rose-500 focus-visible:border-rose-600 focus-visible:ring-rose-500/20",
        className
      )}
    />
  );
}

export interface SelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "size"> {
  size?: "sm" | "md";
}

export function Select({ className, size = "md", id, "aria-describedby": ariaDescribedby, ...props }: SelectProps) {
  const ctx = React.useContext(FieldContext);
  const resolvedId = id ?? ctx?.id;
  const isSm = size === "sm";

  const resolvedDescribedBy =
    ariaDescribedby ??
    (ctx?.hasError ? ctx.errorId : ctx?.hasHint ? ctx.hintId : undefined);

  return (
    <div className="relative w-full">
      <select
        id={resolvedId}
        aria-describedby={resolvedDescribedBy}
        aria-invalid={ctx?.hasError || undefined}
        {...props}
        className={cn(
          "w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 transition-colors appearance-none cursor-pointer placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-500 focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 disabled:opacity-50 disabled:pointer-events-none",
          isSm ? "h-9 px-3 pr-8 text-sm font-medium" : "h-11 sm:h-10 px-3 sm:px-4 pr-10 text-base sm:text-sm",
          ctx?.hasError && "border-rose-500 focus-visible:border-rose-600 focus-visible:ring-rose-500/20",
          className
        )}
      />
      <ChevronDown
        className={cn(
          "pointer-events-none absolute top-1/2 -translate-y-1/2 text-slate-400",
          isSm ? "right-2 size-4" : "right-3 size-4"
        )}
        aria-hidden="true"
      />
    </div>
  );
}

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  showCount?: boolean;
}

export function Textarea({
  id,
  className,
  "aria-describedby": ariaDescribedby,
  maxLength,
  showCount,
  defaultValue,
  value,
  onChange,
  ...props
}: TextareaProps) {
  const ctx = React.useContext(FieldContext);
  const resolvedId = id ?? ctx?.id;

  const [charCount, setCharCount] = React.useState<number>(() => {
    if (typeof value === "string") return value.length;
    if (typeof defaultValue === "string") return defaultValue.length;
    return 0;
  });

  React.useEffect(() => {
    if (typeof value === "string") {
      setCharCount(value.length);
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCharCount(e.target.value.length);
    onChange?.(e);
  };

  const resolvedDescribedBy =
    ariaDescribedby ??
    (ctx?.hasError ? ctx.errorId : ctx?.hasHint ? ctx.hintId : undefined);

  const shouldShowCounter = (showCount ?? Boolean(maxLength)) && maxLength !== undefined;

  return (
    <div className="relative w-full">
      <textarea
        id={resolvedId}
        maxLength={maxLength}
        value={value}
        defaultValue={defaultValue}
        onChange={handleChange}
        aria-describedby={resolvedDescribedBy}
        aria-invalid={ctx?.hasError || undefined}
        {...props}
        className={cn(
          "w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 px-3 sm:px-4 py-2 sm:py-3 text-base sm:text-sm text-slate-900 dark:text-slate-100 transition-colors placeholder:text-slate-400 dark:placeholder:text-slate-500 hover:border-slate-400 dark:hover:border-slate-500 focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20 resize-y disabled:opacity-50 disabled:pointer-events-none",
          shouldShowCounter ? "pb-7" : "",
          ctx?.hasError && "border-rose-500 focus-visible:border-rose-600 focus-visible:ring-rose-500/20",
          className
        )}
      />
      {shouldShowCounter ? (
        <span
          className="pointer-events-none absolute bottom-2 right-3 text-xs font-mono tabular-nums text-slate-400 dark:text-slate-500"
          aria-live="polite"
        >
          {charCount} / {maxLength}
        </span>
      ) : null}
    </div>
  );
}
