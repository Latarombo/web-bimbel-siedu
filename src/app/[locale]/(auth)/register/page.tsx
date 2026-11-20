import { getTranslations } from 'next-intl/server';
import RegisterForm from '@/components/auth/register-form';
import RegisterShell from '@/components/auth/register-shell';
import { googleOAuthEnabled } from '@/lib/auth/oauth';

export async function generateMetadata() {
    const t = await getTranslations('auth');
    return { title: t('register') };
}

export default async function RegisterPage() {
    const t = await getTranslations('auth');
    return (
        <RegisterShell heading={t('authHero')}>
            <RegisterForm googleEnabled={googleOAuthEnabled} />
        </RegisterShell>
    );
}
