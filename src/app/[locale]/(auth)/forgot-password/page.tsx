import { getTranslations } from 'next-intl/server';
import { WaveShell } from "@/components/wave-shell";
import ForgotForm from "@/components/auth/forgot-form";

export async function generateMetadata() {
    const t = await getTranslations('auth');
    return { title: t('forgotMeta') };
}

export default async function ForgotPage() {
  return (
    <WaveShell>
      <ForgotForm />
    </WaveShell>
  );
}
