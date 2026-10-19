import { getTranslations } from 'next-intl/server';
import { WaveShell } from "@/components/wave-shell";
import ResetForm from "@/components/auth/reset-form";
import { verifyResetToken } from "@/app/actions/password-reset";
import { Link } from "@/i18n/navigation";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const t = await getTranslations('auth');
  return { title: t('resetMeta', { token: token.slice(0, 8) }) };
}

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const t = await getTranslations('auth');
  const { token } = await params;

  const verification = await verifyResetToken(token);

  if (!verification.valid) {
    return (
      <WaveShell>
        <div className="text-center py-2">
          {/* Warning Icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 shadow-xs">
            <svg
              className="h-7 w-7 text-rose-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>

          <h2 className="text-xl sm:text-[22px] font-bold text-slate-900 mb-2 tracking-tight">
            {t('tokenInvalidTitle')}
          </h2>
          <p className="text-sm text-slate-600 mb-6 leading-relaxed max-w-sm mx-auto">
            {t('tokenInvalidDesc')}
          </p>

          <div className="space-y-3">
            <Link
              href="/forgot-password"
              className="w-full bg-brand hover:bg-brand-strong text-white text-sm font-semibold py-3 rounded-lg transition-colors flex items-center justify-center text-center shadow-xs cursor-pointer"
            >
              {t('requestNewLink')}
            </Link>

            <div className="mt-4 text-center">
              <Link
                href="/login"
                className="inline-block text-sm font-semibold text-brand hover:text-brand-strong transition-colors cursor-pointer"
              >
                {t('backLogin')}
              </Link>
            </div>
          </div>
        </div>
      </WaveShell>
    );
  }

  return (
    <WaveShell>
      <ResetForm token={token} email={verification.email} />
    </WaveShell>
  );
}
