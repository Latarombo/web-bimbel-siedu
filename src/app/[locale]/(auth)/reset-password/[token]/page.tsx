import { getTranslations } from 'next-intl/server';
import { AuthShell } from "@/components/auth-shell";
import ResetForm from "@/components/auth/reset-form";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = await getTranslations('auth');
  return { title: t('resetMeta', {token: token.slice(0, 8)}) };
}

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
    const t = await getTranslations('auth');
  const { token } = await params;
  return (
    <AuthShell title={t('authHero')}>
      <h2 className="text-2xl sm:text-[20px] sm:leading-[1.3] font-bold text-slate-900 mb-8">{t('resetPassword')}</h2>
      <ResetForm token={token} />
    </AuthShell>
  );
}
