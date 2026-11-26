import { getLocale } from 'next-intl/server';
import { redirect, getPathname } from '@/i18n/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/prisma/db';
import { collect } from '@/lib/collect';
import {
  AdminMessagesView,
  type AdminMessageRow,
} from '@/components/admin/views/messages-view';

export const dynamic = 'force-dynamic';

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; baca?: string }>;
}) {
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) {
    return redirect({
      href: {
        pathname: '/login',
        query: {
          next: getPathname({ href: '/admin/messages', locale }),
        },
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

  const { status, baca } = await searchParams;
  const semua = await collect(db.orm.public.PesanKontak.all());

  const fmtWaktu = (iso: string) =>
    new Date(iso).toLocaleString(locale === 'en' ? 'en-GB' : 'id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Asia/Jakarta',
    });

  const messages: AdminMessageRow[] = semua
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .map((p) => {
      const normalizedStatus =
        p.status === 'diproses' || p.status === 'selesai' ? p.status : 'baru';
      return {
        id: p.id,
        nama: p.nama,
        email: p.email,
        telepon: p.telepon ?? null,
        jenjang: p.jenjang ?? null,
        sekolah: p.sekolah ?? null,
        subjek: p.subjek,
        pesan: p.pesan,
        status: normalizedStatus,
        createdAt: p.createdAt,
        createdAtLabel: fmtWaktu(p.createdAt),
      };
    });

  const parsedBaca = baca ? Number(baca) : undefined;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <AdminMessagesView
        messages={messages}
        initialStatus={status}
        initialSelectedId={
          parsedBaca && Number.isInteger(parsedBaca) ? parsedBaca : undefined
        }
      />
    </div>
  );
}
