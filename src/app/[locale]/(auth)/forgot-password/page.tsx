import { getTranslations } from 'next-intl/server';
import { AuthFullPageShell } from "@/components/auth-full-page-shell";
import ForgotForm from "@/components/auth/forgot-form";

export async function generateMetadata() {
    const t = await getTranslations('auth');
    return { title: t('forgotMeta') };
}

export default async function ForgotPage() {
  return (
    <AuthFullPageShell>
      <ForgotForm />
    </AuthFullPageShell>
  );
}
