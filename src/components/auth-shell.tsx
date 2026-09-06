import Link from "next/link";
import { Card, CardPad } from "@/components/ui/card";

export function AuthShell({ title, subtitle, children, footer }: { title: string; subtitle?: string; children: React.ReactNode; footer?: React.ReactNode }) {
  return (
    <div className="min-h-[70vh] grid place-items-center px-4 py-10">
      <div className="w-full max-w-[440px]">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <span className="w-8 h-8 rounded-lg bg-brand grid place-items-center text-white font-black text-sm">S</span>
            <span className="font-bold">Siedu</span>
          </Link>
          <h1 className="mt-4 text-xl font-black tracking-tight">{title}</h1>
          {subtitle ? <p className="mt-2 text-sm text-muted leading-relaxed">{subtitle}</p> : null}
        </div>
        <Card><CardPad>{children}</CardPad></Card>
        {footer ? <p className="mt-4 text-center text-sm text-muted">{footer}</p> : null}
      </div>
    </div>
  );
}
