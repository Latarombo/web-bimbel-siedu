import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { AuthShell } from "@/components/auth-shell";
import ForgotForm from "@/components/auth/forgot-form";

export async function generateMetadata() {
    const t = await getTranslations('auth');
    return { title: t('forgotMeta') };
}

export default async function ForgotPage() {
    const t = await getTranslations('auth');
  return (
    <AuthShell title={t('authHero')} footer={<><Link href="/login" className="font-semibold text-brand hover:underline">{t('backLogin')}</Link></>}>
      <h2 className="text-2xl sm:text-[20px] sm:leading-[1.3] font-bold text-slate-900 mb-8">{t('forgotTitle')}</h2>
      <ForgotForm />
    </AuthShell>
  );
}
