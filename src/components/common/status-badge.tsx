import { Badge } from "@/components/ui/badge";
import { useTranslations } from "next-intl";

export type StatusPendaftaran =
  | "menunggu_pembayaran"
  | "terdaftar"
  | "tertunggak"
  | "dibatalkan_timeout"
  | "dibatalkan_tunggakan"
  | "dibatalkan_orang_tua"
  | "dibatalkan_kelas";

export const STATUS_AKTIF: StatusPendaftaran[] = ["menunggu_pembayaran", "terdaftar", "tertunggak"];

export function StatusBadge({ status }: { status: StatusPendaftaran }) {
  const t = useTranslations("shared.status");
  const dot =
    status === "terdaftar"
      ? "bg-emerald-500"
      : status === "tertunggak"
        ? "bg-rose-500"
        : status === "menunggu_pembayaran"
          ? "bg-amber-500"
          : "bg-slate-300";
  const tone =
    status === "terdaftar"
      ? "emerald"
      : status === "tertunggak"
        ? "red"
        : status === "menunggu_pembayaran"
          ? "amber"
          : "slate";
  return (
    <Badge tone={tone}>
      <span className={`mr-1.5 inline-block size-1.5 rounded-full ${dot}`} aria-hidden="true" />
      {t(status)}
    </Badge>
  );
}
