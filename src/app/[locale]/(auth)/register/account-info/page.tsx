import { getTranslations, getLocale } from 'next-intl/server';
import AccountInfoForm from '@/components/AccountInfoForm';
import RegisterShell from '@/components/auth/register-shell';
import { auth } from '@/lib/auth';
import { db } from '@/prisma/db';
import { redirect } from '@/i18n/navigation';

export async function generateMetadata() {
    const t = await getTranslations('auth');
    return { title: t('accountMeta') };
}
export const dynamic = 'force-dynamic';

export default async function AccountInfoPage({
    searchParams,
}: {
    searchParams: Promise<{ lengkap?: string }>;
}) {
    const t = await getTranslations('auth');
    const locale = await getLocale();
    const { lengkap } = await searchParams;
    // Tembok dalam: step 2 hanya untuk orang tua yang baru register.
    const session = await auth();
    if (!session?.user) return redirect({href: '/login?next=/register/account-info', locale});
    if (session.user.role !== 'orang_tua') return redirect({href: '/login', locale});

    const parent = await db.orm.public.User
        .where({ id: Number(session.user.id) })
        .first();
    if (!parent) return redirect({href: '/login?next=/register/account-info', locale});

    // Consent PRD F1 ditagih di step 2 bila belum ada — terjadi pada akun yang
    // dibuat via Google (melewati step 1) atau akun lama pra-kolom consent.
    const needsConsent = !parent.privasiDisetujuiAt || !parent.waliDisetujuiAt;
    const isGoogle = Boolean(parent.googleSub);

    return (
        <RegisterShell heading={t('authHero')}>
            <AccountInfoForm
                needsConsent={needsConsent}
                isGoogle={isGoogle}
                currentName={parent.name}
                telepon={parent.nomorTelepon}
                dikembalikan={lengkap === '1'}
            />
        </RegisterShell>
    );
}
