import { LucideIcon } from "lucide-react";
import { CopySectionLinkButton } from "@/components/legal/copy-section-link-button";

interface LegalSectionCardProps {
  id: string;
  title: string;
  icon?: LucideIcon;
  copyLinkLabel?: string;
  copiedLabel?: string;
  children: React.ReactNode;
}

export function LegalSectionCard({
  id,
  title,
  icon: Icon,
  copyLinkLabel = "Salin tautan pasal",
  copiedLabel = "Tautan tersalin!",
  children,
}: LegalSectionCardProps) {
  return (
    <section
      id={id}
      className="scroll-mt-28 group relative rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-2xs transition-all duration-200 hover:border-blue-200/80 hover:shadow-xs"
    >
      {/* Section Header */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand">
              <Icon className="size-4.5" />
            </div>
          )}
          <h2 className="text-lg font-bold leading-snug tracking-tight text-foreground sm:text-xl">
            {title}
          </h2>
        </div>

        {/* Copy Anchor Link Button */}
        <CopySectionLinkButton
          id={id}
          copyLinkLabel={copyLinkLabel}
          copiedLabel={copiedLabel}
        />
      </div>

      {/* Section Content */}
      <div className="mt-5 space-y-4 text-sm leading-relaxed text-body sm:text-base sm:leading-7">
        {children}
      </div>
    </section>
  );
}
