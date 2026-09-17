import { getTranslations, getLocale } from 'next-intl/server';
import ChildInfoForm from '@/components/ChildInfoForm';
import RegisterShell from '@/components/auth/register-shell';
import { auth } from '@/lib/auth';
import { db } from '@/prisma/db';
import { collect } from '@/lib/collect';
import { redirect } from '@/i18n/navigation';

export async function generateMetadata() {
    const t = await getTranslations('auth');
    return { title: t('stepChild') };
}
export const dynamic = 'force-dynamic';

export default async function ChildInfoPage() {
    const t = await getTranslations('auth');
    const locale = await getLocale();
    // Tembok dalam: step 3 hanya untuk orang tua yang baru register.
    const session = await auth();
    if (!session?.user) return redirect({href: '/login?next=/register/child-info', locale});
    if (session.user.role !== 'orang_tua') return redirect({href: '/login', locale});

    const ortuId = Number(session.user.id);

    // No. HP ortu — sumber toggle "No. HP anak sama dengan orang tua" (ref desain).
    const parent = await db.orm.public.User.where({ id: ortuId }).first();

    // Bug lama: halaman ini bisa dituju berulang lewat URL dan tiap submit
    // membuat anak baru tanpa batas.wizard hanya untuk anak pertama —
    // anak berikutnya lewat /children/new yang punya guard sendiri.
    const jumlahAnak = (
        await collect(db.orm.public.Anak.where((a) => a.orangTuaId.eq(ortuId)).all())
    ).length;
    if (jumlahAnak > 0) return redirect({href: '/children', locale});

    return (
        <RegisterShell heading={t('authHero')}>
            <ChildInfoForm parentPhone={parent?.nomorTelepon ?? ''} />
        </RegisterShell>
    );
}
