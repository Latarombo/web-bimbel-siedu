import Image from "next/image";
import { Link } from '@/i18n/navigation';
import { Card, CardPad } from "@/components/ui/card";

export function CleanShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="grid min-h-[70dvh] place-items-center px-4 py-10">
      <div className="w-full max-w-110">
        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2">
            <Image src="/images/Logo.png" alt="Siedu" width={120} height={36} className="h-8 w-auto" priority />
          </Link>
          {title ? <h1 className="mt-4 text-xl font-black tracking-tight">{title}</h1> : null}
          {subtitle ? <p className="mt-2 text-sm text-muted leading-relaxed">{subtitle}</p> : null}
        </div>
        <Card className="rounded-2xl border border-slate-200/90 shadow-sm">
          <CardPad className="p-6 sm:p-8">{children}</CardPad>
        </Card>
        {footer ? <p className="mt-4 text-center text-sm text-muted">{footer}</p> : null}
      </div>
    </div>
  );
}
