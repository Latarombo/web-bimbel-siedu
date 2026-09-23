import { Link } from "@/i18n/navigation";
import { Mail, Phone, MessageSquareQuote, ArrowRight } from "lucide-react";
import { SITE } from "@/lib/site";

interface LegalContactCardProps {
  title?: string;
  description?: string;
  contactButtonText?: string;
  badge?: string;
}

export function LegalContactCard({
  title = "Ada pertanyaan atau butuh klarifikasi?",
  description = "Tim kami siap membantu menjawab pertanyaan terkait privasi data, perbaikan data, atau syarat layanan.",
  contactButtonText = "Hubungi Tim Legal Siedu",
  badge = "Bantuan Hukum & Kebijakan",
}: LegalContactCardProps) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-blue-200/80 bg-linear-to-br from-blue-600 via-blue-700 to-indigo-800 p-6 sm:p-8 text-white shadow-md">
      {/* Decorative background circle */}
      <div
        className="pointer-events-none absolute -right-12 -top-12 size-48 rounded-full bg-white/10 blur-2xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute -left-12 -bottom-12 size-48 rounded-full bg-indigo-500/20 blur-2xl"
        aria-hidden="true"
      />

      <div className="relative z-10 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-xl space-y-2">
          <div className="flex items-center gap-2 text-blue-200">
            <MessageSquareQuote className="size-4" />
            <span className="text-xs font-semibold uppercase tracking-wider">
              {badge}
            </span>
          </div>
          <h3 className="text-xl font-bold tracking-tight text-white sm:text-2xl">
            {title}
          </h3>
          <p className="text-xs leading-relaxed text-blue-100 sm:text-sm">
            {description}
          </p>

          {/* Contact Details Quick Links */}
          <div className="flex flex-wrap gap-4 pt-2 text-xs text-blue-100">
            <a
              href={`mailto:${SITE.email}`}
              className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-white"
            >
              <Mail className="size-3.5" />
              <span>{SITE.email}</span>
            </a>
            <a
              href={`tel:${SITE.telepon.replace(/\s+/g, "")}`}
              className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-white"
            >
              <Phone className="size-3.5" />
              <span>{SITE.telepon}</span>
            </a>
          </div>
        </div>

        <div className="shrink-0">
          <Link
            href="/contact"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-xs font-bold text-blue-700 shadow-sm transition-all hover:bg-blue-50 hover:shadow-md focus:outline-hidden focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-700"
          >
            <span>{contactButtonText}</span>
            <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
