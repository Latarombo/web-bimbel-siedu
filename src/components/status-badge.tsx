import { Badge } from "@/components/ui/badge";

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
  const tone =
    status === "terdaftar"
      ? "emerald"
      : status === "tertunggak"
        ? "red"
        : status === "menunggu_pembayaran"
          ? "amber"
          : "slate";
  const label = status.replaceAll("_", " ");
  return <Badge tone={tone}>{label}</Badge>;
}
