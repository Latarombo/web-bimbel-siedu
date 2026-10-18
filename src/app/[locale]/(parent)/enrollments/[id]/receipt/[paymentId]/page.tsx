import { notFound, redirect } from 'next/navigation';
import { getLocale } from 'next-intl/server';
import { auth } from '@/lib/auth';
import { db } from '@/prisma/db';
import { collect } from '@/lib/collect';
import { OfficialReceipt, type OfficialReceiptData } from '@/components/parent/official-receipt';

export const dynamic = 'force-dynamic';

export default async function ReceiptPage({
  params,
}: {
  params: Promise<{ id: string; paymentId: string }>;
}) {
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) {
    return redirect(`/${locale}/login?next=/home`);
  }

  const { id, paymentId } = await params;
  const pid = Number(id);
  const payId = Number(paymentId);

  if (!Number.isInteger(pid) || !Number.isInteger(payId)) {
    notFound();
  }

  const userId = Number(session.user.id);
  const userRole = session.user.role;

  // 1. Fetch pendaftaran and pembayaran
  const [pendaftaranRows, pembayaranRows] = await Promise.all([
    collect(db.orm.public.Pendaftaran.where((p) => p.id.eq(pid)).all()),
    collect(db.orm.public.Pembayaran.where((b) => b.id.eq(payId)).all()),
  ]);

  const pendaftaran = pendaftaranRows[0];
  const pembayaran = pembayaranRows[0];

  if (!pendaftaran || !pembayaran || pembayaran.pendaftaranId !== pendaftaran.id) {
    notFound();
  }

  // 2. Fetch associated child, class, parent, teacher
  const [anakRows, kelasRows] = await Promise.all([
    collect(db.orm.public.Anak.where((a) => a.id.eq(pendaftaran.anakId)).all()),
    collect(db.orm.public.Kelas.where((k) => k.id.eq(pendaftaran.kelasId)).all()),
  ]);

  const anak = anakRows[0];
  const kelas = kelasRows[0];
  if (!anak || !kelas) notFound();

  // Guard: User must be parent of this child or admin
  if (userRole !== 'admin' && anak.orangTuaId !== userId) {
    notFound();
  }

  const [ortuRows, mapelRows, guruRows, periodeRows] = await Promise.all([
    collect(db.orm.public.User.where((u) => u.id.eq(anak.orangTuaId)).all()),
    collect(db.orm.public.MataPelajaran.where((m) => m.id.eq(kelas.mataPelajaranId)).all()),
    collect(db.orm.public.User.where((u) => u.id.eq(kelas.guruId)).all()),
    collect(db.orm.public.PeriodePendaftaran.where((per) => per.id.eq(kelas.periodeId)).all()),
  ]);

  const ortu = ortuRows[0];
  const mapel = mapelRows[0];
  const guru = guruRows[0];
  const periode = periodeRows[0];

  const payDate = pembayaran.dibayarPada || pembayaran.createdAt;
  const payDateObj = new Date(payDate);
  const yearStr = payDateObj.getFullYear();
  const monthStr = String(payDateObj.getMonth() + 1).padStart(2, '0');
  const nomorKuitansi = `KWT-${yearStr}${monthStr}-${String(pembayaran.id).padStart(5, '0')}`;

  let tipeTagihan = 'Pembayaran Lunas';
  if (pembayaran.tipe === 'dp') {
    tipeTagihan = 'Uang Muka (DP Pendaftaran)';
  } else if (pembayaran.tipe === 'cicilan') {
    tipeTagihan = `Cicilan Ke-${pembayaran.cicilanKe || 1} dari ${pendaftaran.tenorBulan || 1} bulan`;
  }

  const receiptData: OfficialReceiptData = {
    nomorKuitansi,
    tanggalBayar: payDate,
    referensiGateway: pembayaran.referensiGateway,
    namaOrangTua: ortu?.name || 'Wali Murid',
    emailOrangTua: ortu?.email || '-',
    teleponOrangTua: ortu?.nomorTelepon || '-',
    namaSiswa: anak.nama,
    jenjangSiswa: kelas.jenjang,
    pendaftaranId: pendaftaran.id,
    namaMapel: mapel?.nama || `Kelas #${kelas.id}`,
    namaGuru: guru?.name || 'Pengajar Siedu',
    periodeNama: periode?.nama || 'Semester Aktif',
    tipeTagihan,
    cicilanKe: pembayaran.cicilanKe,
    totalCicilan: pendaftaran.tenorBulan,
    jumlah: Number(pembayaran.jumlah),
    metodeBayar: pendaftaran.metodeBayar,
    backUrl: `/${locale}/enrollments/${pendaftaran.id}`,
  };

  return <OfficialReceipt data={receiptData} />;
}
