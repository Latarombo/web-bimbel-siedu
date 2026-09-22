import { LucideIcon, Sparkles } from "lucide-react";

export interface KeyTakeawayItem {
  icon: LucideIcon;
  title: string;
  description: string;
}

interface LegalTakeawaysProps {
  sectionTitle: string;
  sectionSubtitle?: string;
  items: KeyTakeawayItem[];
}

export function LegalTakeaways({
  sectionTitle,
  sectionSubtitle,
  items,
}: LegalTakeawaysProps) {
  return (
    <div className="rounded-2xl border border-blue-100 bg-linear-to-b from-blue-50/60 via-sky-50/30 to-white p-5 sm:p-6 shadow-xs">
      <div className="flex items-center gap-2 mb-2">
        <span className="flex size-7 items-center justify-center rounded-lg bg-blue-600/10 text-brand">
          <Sparkles className="size-4 text-brand" />
        </span>
        <h2 className="text-base font-bold text-foreground sm:text-lg">
          {sectionTitle}
        </h2>
      </div>

      {sectionSubtitle && (
        <p className="mb-5 text-xs text-body sm:text-sm max-w-2xl">
          {sectionSubtitle}
        </p>
      )}

      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="group relative flex flex-col justify-between rounded-xl border border-slate-200/80 bg-white p-4 shadow-2xs transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-soft hover:shadow-xs"
            >
              <div>
                <div className="mb-3 flex size-9 items-center justify-center rounded-lg bg-blue-50 text-brand transition-colors group-hover:bg-blue-600 group-hover:text-white">
                  <Icon className="size-4.5" />
                </div>
                <h3 className="text-sm font-bold text-foreground">
                  {item.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-body">
                  {item.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
