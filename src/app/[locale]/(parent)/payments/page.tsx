import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { midtransConfigured } from "@/lib/midtrans";
import { PaymentCenterClient } from "@/components/parent/payments/payment-center-client";
import type {
  EnrollmentBillingGroup,
  PaymentItem,
  PaymentStats,
} from "@/components/parent/payments/payment-types";

export const dynamic = "force-dynamic";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; anak?: string }>;
}) {
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) {
    return redirect({ href: "/login?next=/payments", locale });
  }
  const ortuId = Number(session.user.id);
  const { tab, anak: anakParam } = await searchParams;

  // 1. Ambil data anak milik orang tua ini
  const anak = await collect(
    db.orm.public.Anak.where((a) => a.orangTuaId.eq(ortuId)).all()
  );
  const anakIds = new Set(anak.map((a) => a.id));
  const namaAnakMap = new Map(anak.map((a) => [a.id, a.nama]));
  const anakList = anak.map((a) => ({ id: a.id, nama: a.nama }));

  // 2. Pendaftaran milik anak-anak orang tua ini + detail kelas
  const pendaftaran = await collect(
    db.orm.public.Pendaftaran
      .include("kelas", (b) =>
        b.select("id", "mataPelajaranId", "biayaPeriode", "biayaDp", "tenorMaksimum", "jenjang", "tingkat")
      )
      .all()
  );
  const milikSaya = pendaftaran.filter((p) => anakIds.has(p.anakId));

  // 3. Nama mapel per kelas
  const mapelIds = [...new Set(milikSaya.map((p) => p.kelas.mataPelajaranId))];
  const mapelMap = new Map<number, string>(
    (
      await Promise.all(
        mapelIds.map(async (mid) => {
          const rows = await collect(
            db.orm.public.MataPelajaran.where((m) => m.id.eq(mid)).all()
          );
          return rows.map((m) => [m.id, m.nama] as const);
        })
      )
    ).flat()
  );

  // 4. Semua tagihan pendaftaran milik saya
  const tagihanRaw = (
    await Promise.all(
      milikSaya.map((p) =>
        collect(
          db.orm.public.Pembayaran.where((b) => b.pendaftaranId.eq(p.id))
            .orderBy((b) => b.jatuhTempo.asc())
            .all()
        )
      )
    )
  ).flat();

  const now = new Date();
  const nowIso = now.toISOString().slice(0, 10);

  // 5. Transform tagihan menjadi PaymentItem
  const pById = new Map(milikSaya.map((p) => [p.id, p]));

  const paymentItems: PaymentItem[] = tagihanRaw.map((b) => {
    const p = pById.get(b.pendaftaranId);
    const anakNama = p ? namaAnakMap.get(p.anakId) ?? "Anak" : "Anak";
    const mapelNama = p ? mapelMap.get(p.kelas.mataPelajaranId) ?? `Kelas #${p.kelasId}` : "-";

    const isOverdue =
      b.status === "pending" && !!b.jatuhTempo && b.jatuhTempo < nowIso;

    let daysUntilDue: number | null = null;
    if (b.jatuhTempo) {
      const diffMs = new Date(b.jatuhTempo).getTime() - new Date(nowIso).getTime();
      daysUntilDue = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    }

    const bisaBayar = b.status === "pending";

    return {
      id: b.id,
      pendaftaranId: b.pendaftaranId,
      anakId: p?.anakId ?? 0,
      namaAnak: anakNama,
      kelasId: p?.kelasId ?? 0,
      namaMapel: mapelNama,
      tingkat: p?.kelas?.tingkat ?? null,
      jenjang: p?.kelas?.jenjang ?? "",
      tipe: b.tipe as "dp" | "cicilan" | "lunas",
      cicilanKe: b.cicilanKe,
      totalCicilan: p?.tenorBulan ?? null,
      jumlah: Number(b.jumlah),
      jatuhTempo: b.jatuhTempo,
      dibayarPada: b.dibayarPada,
      status: b.status as "pending" | "berhasil" | "gagal",
      referensiGateway: b.referensiGateway,
      createdAt: b.createdAt,
      isOverdue,
      daysUntilDue,
      bisaBayar,
    };
  });

  // 6. Hitung Statistik Finansial
  const belumLunas = paymentItems.filter(
    (b) => b.status === "pending" || b.status === "gagal"
  );
  const overdueBills = belumLunas.filter((b) => b.isOverdue);
  const riwayatLunas = paymentItems.filter((b) => b.status === "berhasil");

  const upcomingPending = belumLunas
    .filter((b) => b.jatuhTempo)
    .sort((a, b) => (a.jatuhTempo ?? "").localeCompare(b.jatuhTempo ?? ""));

  const earliestDue = upcomingPending[0] ?? null;

  const stats: PaymentStats = {
    totalPendingAmount: belumLunas.reduce((acc, b) => acc + b.jumlah, 0),
    totalPendingCount: belumLunas.length,
    overdueCount: overdueBills.length,
    earliestDueDate: earliestDue?.jatuhTempo ?? null,
    daysUntilEarliestDue: earliestDue?.daysUntilDue ?? null,
    totalPaidAmount: riwayatLunas.reduce((acc, b) => acc + b.jumlah, 0),
    totalPaidCount: riwayatLunas.length,
  };

  // 7. Kelompokkan per Pendaftaran Kelas
  const groups: EnrollmentBillingGroup[] = milikSaya.map((p) => {
    const childName = namaAnakMap.get(p.anakId) ?? "Anak";
    const subjectName = mapelMap.get(p.kelas.mataPelajaranId) ?? `Kelas #${p.kelasId}`;
    const pBills = paymentItems.filter((b) => b.pendaftaranId === p.id);
    const paidBills = pBills.filter((b) => b.status === "berhasil");

    const totalBiaya = Number(p.kelas.biayaPeriode);
    const totalLunas = paidBills.reduce((acc, b) => acc + b.jumlah, 0);

    const totalSlots =
      p.metodeBayar === "dp_cicilan" && p.tenorBulan ? p.tenorBulan : 1;
    const countLunas = paidBills.length;
    const percentLunas =
      totalBiaya > 0
        ? Math.min(100, Math.round((totalLunas / totalBiaya) * 100))
        : 100;

    return {
      pendaftaranId: p.id,
      anakId: p.anakId,
      namaAnak: childName,
      kelasId: p.kelasId,
      namaMapel: subjectName,
      jenjang: p.kelas.jenjang,
      tingkat: p.kelas.tingkat,
      metodeBayar: p.metodeBayar,
      tenorBulan: p.tenorBulan,
      totalBiaya,
      totalLunas,
      totalTagihan: pBills.reduce((acc, b) => acc + b.jumlah, 0),
      countLunas,
      countTotal: totalSlots,
      percentLunas,
      statusPendaftaran: p.status,
      tagihan: pBills,
    };
  });

  const isGatewayConfigured = midtransConfigured();

  return (
    <PaymentCenterClient
      initialTab={tab}
      initialAnakId={anakParam}
      anakList={anakList}
      groups={groups}
      stats={stats}
      isGatewayConfigured={isGatewayConfigured}
      parentName={session.user.name ?? "Orang Tua Siswa"}
    />
  );
}
