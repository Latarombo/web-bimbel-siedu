import { getTranslations, getLocale } from 'next-intl/server';
import { redirect } from '@/i18n/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/prisma/db';
import { collect } from '@/lib/collect';
import StatusForm, {
  ClassOption,
  ExistingStatus,
  StudentRecipient,
} from '@/components/teacher/status-form';

export const dynamic = 'force-dynamic';

export default async function TeacherStatusPage() {
  const t = await getTranslations('teacher');
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) return redirect({ href: '/login?next=/teacher/status', locale });
  const guruId = Number(session.user.id);

  // 1. Get active classes owned by this teacher
  const [kelas, mapel, pendaftaran, anakList] = await Promise.all([
    collect(db.orm.public.Kelas.where((k) => k.guruId.eq(guruId)).where((k) => k.status.eq('aktif')).all()),
    collect(db.orm.public.MataPelajaran.all()),
    collect(db.orm.public.Pendaftaran.all()),
    collect(db.orm.public.Anak.all()),
  ]);

  const mapelMap = new Map(mapel.map((m) => [m.id, m.nama]));
  const anakMap = new Map(anakList.map((a) => [a.id, a]));

  const classOptions: ClassOption[] = kelas.map((k) => {
    const activeEnrollments = pendaftaran.filter(
      (p) => p.kelasId === k.id && ['terdaftar', 'tertunggak'].includes(p.status),
    );

    const students: StudentRecipient[] = activeEnrollments.map((p) => {
      const anak = anakMap.get(p.anakId);
      return {
        pendaftaranId: p.id,
        anakId: p.anakId,
        namaAnak: anak?.nama ?? `Siswa #${p.anakId}`,
        persetujuanFoto: Boolean(anak?.persetujuanFoto),
      };
    });

    return {
      id: k.id,
      nama: `${mapelMap.get(k.mataPelajaranId) ?? 'Mata Pelajaran'} - Kelas #${k.id}`,
      jenjang: k.jenjang,
      students,
    };
  });

  // 2. Fetch past statuses posted by this teacher
  const [statusList, allRecipients] = await Promise.all([
    collect(db.orm.public.StatusPembelajaran.where((s) => s.dibuatOleh.eq(guruId)).all()),
    collect(db.orm.public.StatusPembelajaranPenerima.all()),
  ]);

  const kelasMap = new Map(kelas.map((k) => [k.id, mapelMap.get(k.mataPelajaranId) ?? `Kelas #${k.id}`]));

  // Count recipients per status
  const recipientCountMap = new Map<number, number>();
  for (const r of allRecipients) {
    recipientCountMap.set(r.statusId, (recipientCountMap.get(r.statusId) ?? 0) + 1);
  }

  // Sort statuses by createdAt descending
  statusList.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );

  const pastStatuses: ExistingStatus[] = statusList.map((s) => {
    let parsedMedia: string[] = [];
    if (s.mediaUrls) {
      try {
        parsedMedia = JSON.parse(s.mediaUrls);
      } catch {
        parsedMedia = [];
      }
    }

    return {
      id: s.id,
      kelasId: s.kelasId,
      kelasNama: kelasMap.get(s.kelasId) ?? `Kelas #${s.kelasId}`,
      kontenTeks: s.kontenTeks,
      mediaUrls: parsedMedia,
      status: s.status,
      diterbitkanPada: s.diterbitkanPada,
      kadaluarsaPada: s.kadaluarsaPada,
      penerimaCount: recipientCountMap.get(s.id) ?? 0,
    };
  });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 space-y-6">
      <div className="pb-4 border-b border-slate-200 dark:border-slate-800">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-slate-50">
          {t('statusTitle')}
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1">
          {t('statusSubtitle')}
        </p>
      </div>

      <StatusForm classes={classOptions} pastStatuses={pastStatuses} />
    </div>
  );
}
