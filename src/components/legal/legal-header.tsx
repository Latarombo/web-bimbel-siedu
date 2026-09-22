import { Link } from "@/i18n/navigation";
import { Calendar, Clock, ShieldCheck, FileText, ChevronRight } from "lucide-react";

interface LegalHeaderProps {
  currentDoc: "privacy" | "terms";
  title: string;
  summary: string;
  updatedAt: string;
  readTime: string;
  privacyLabel: string;
  termsLabel: string;
  lastUpdatedLabel?: string;
  readTimeLabel?: string;
}

export function LegalHeader({
  currentDoc,
  title,
  summary,
  updatedAt,
  readTime,
  privacyLabel,
  termsLabel,
  lastUpdatedLabel = "Terakhir diperbarui",
  readTimeLabel = "Estimasi baca",
}: LegalHeaderProps) {
  return (
    <header className="relative space-y-6">
      {/* Breadcrumbs & Tab Switcher Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-muted">
          <Link href="/" className="hover:text-brand transition-colors">
            Beranda
          </Link>
          <ChevronRight className="size-3 text-slate-400" />
          <span className="text-slate-500">Legal</span>
          <ChevronRight className="size-3 text-slate-400" />
          <span className="font-semibold text-foreground">
            {currentDoc === "privacy" ? privacyLabel : termsLabel}
          </span>
        </nav>

        {/* Segmented Pill Switcher */}
        <div className="inline-flex self-start rounded-xl border border-border bg-slate-100/80 p-1 shadow-2xs backdrop-blur-xs">
          <Link
            href="/privacy-policy"
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              currentDoc === "privacy"
                ? "bg-white text-brand shadow-xs"
                : "text-slate-600 hover:text-foreground"
            }`}
          >
            <ShieldCheck className="size-3.5" />
            <span>{privacyLabel}</span>
          </Link>
          <Link
            href="/terms"
            className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-all ${
              currentDoc === "terms"
                ? "bg-white text-brand shadow-xs"
                : "text-slate-600 hover:text-foreground"
            }`}
          >
            <FileText className="size-3.5" />
            <span>{termsLabel}</span>
          </Link>
        </div>
      </div>

      {/* Main Title & Description */}
      <div className="max-w-3xl space-y-3">
        <h1 className="text-3xl font-black leading-tight tracking-tight text-balance text-foreground sm:text-4xl lg:text-5xl">
          {title}
        </h1>
        <p className="text-sm leading-relaxed text-body sm:text-base">
          {summary}
        </p>
      </div>

      {/* Meta Badges */}
      <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs text-muted">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/80 px-3 py-1 font-medium shadow-2xs">
          <Calendar className="size-3.5 text-brand" />
          <span>{lastUpdatedLabel} {updatedAt}</span>
        </div>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-border bg-white/80 px-3 py-1 font-medium shadow-2xs">
          <Clock className="size-3.5 text-brand" />
          <span>{readTimeLabel} {readTime}</span>
        </div>
      </div>
    </header>
  );
}
