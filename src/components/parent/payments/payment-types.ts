export type PaymentItem = {
  id: number;
  pendaftaranId: number;
  anakId: number;
  namaAnak: string;
  kelasId: number;
  namaMapel: string;
  tingkat: string | null;
  jenjang: string;
  tipe: "dp" | "cicilan" | "lunas";
  cicilanKe: number | null;
  totalCicilan: number | null;
  jumlah: number;
  jatuhTempo: string | null;
  dibayarPada: string | null;
  status: "pending" | "berhasil" | "gagal";
  referensiGateway: string | null;
  createdAt: string;
  isOverdue: boolean;
  daysUntilDue: number | null;
  bisaBayar: boolean;
};

export type EnrollmentBillingGroup = {
  pendaftaranId: number;
  anakId: number;
  namaAnak: string;
  kelasId: number;
  namaMapel: string;
  jenjang: string;
  tingkat: string | null;
  metodeBayar: string;
  tenorBulan: number | null;
  totalBiaya: number;
  totalLunas: number;
  totalTagihan: number;
  countLunas: number;
  countTotal: number;
  percentLunas: number;
  statusPendaftaran: string;
  tagihan: PaymentItem[];
};

export type PaymentStats = {
  totalPendingAmount: number;
  totalPendingCount: number;
  overdueCount: number;
  earliestDueDate: string | null;
  daysUntilEarliestDue: number | null;
  totalPaidAmount: number;
  totalPaidCount: number;
};
