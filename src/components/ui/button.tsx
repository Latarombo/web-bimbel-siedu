import Link from "next/link";

type Variant = "primary" | "secondary" | "ghost";
const styles: Record<Variant, string> = {
  primary: "bg-brand text-white hover:bg-blue-700 border border-brand",
  secondary: "bg-white text-foreground border border-border hover:border-foreground",
  ghost: "bg-transparent text-foreground hover:bg-slate-100 border border-transparent",
};

export function Button({
  variant = "primary",
  className = "",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return <button className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors disabled:opacity-50 ${styles[variant]} ${className}`} {...props} />;
}

export function ButtonLink({ variant = "primary", className = "", ...props }: React.ComponentProps<typeof Link> & { variant?: Variant }) {
  return <Link className={`inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${styles[variant]} ${className}`} {...props} />;
}
