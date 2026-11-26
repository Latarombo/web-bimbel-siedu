import { getLocale } from 'next-intl/server';
import { redirect, getPathname } from '@/i18n/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/prisma/db';
import { collect } from '@/lib/collect';
import {
  AdminAuditLogsView,
  type AdminAuditLogRow,
} from '@/components/admin/views/audit-logs-view';

export const dynamic = 'force-dynamic';

export default async function AdminAuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ entitas?: string }>;
}) {
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) {
    return redirect({
      href: {
        pathname: '/login',
        query: { next: getPathname({ href: '/admin/audit-logs', locale }) },
      },
      locale,
    });
  }
  if (session.user.role !== 'admin') {
    return redirect({
      href: session.user.role === 'guru' ? '/teacher/dashboard' : '/home',
      locale,
    });
  }

  const { entitas } = await searchParams;
  const [auditLogs, users] = await Promise.all([
    collect(db.orm.public.AuditPerubahan.all()),
    collect(db.orm.public.User.all()),
  ]);

  const userById = new Map(users.map((u) => [u.id, u]));

  const fmtWaktu = (iso: string) =>
    new Date(iso).toLocaleString(locale === 'en' ? 'en-GB' : 'id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      timeZone: 'Asia/Jakarta',
    });

  const logs: AdminAuditLogRow[] = auditLogs
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((log) => {
      const aktor = userById.get(log.aktorId);
      return {
        id: log.id,
        aktorNama: aktor?.name ?? `User #${log.aktorId}`,
        aktorRole: aktor?.role ?? 'system',
        entitas: log.entitas,
        entitasId: log.entitasId,
        aksi: log.aksi,
        alasan: log.alasan ?? null,
        sebelum: log.sebelum ?? null,
        sesudah: log.sesudah ?? null,
        createdAt: log.createdAt,
        createdAtLabel: fmtWaktu(log.createdAt),
      };
    });

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <AdminAuditLogsView logs={logs} initialEntitas={entitas ?? 'all'} />
    </div>
  );
}
