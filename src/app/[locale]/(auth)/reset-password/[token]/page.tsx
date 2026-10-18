import { getTranslations } from 'next-intl/server';
import { AuthShell } from "@/components/auth-shell";
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
      <AuthShell title={t('authHero')}>
        <div className="text-center py-4">
          {/* Warning Icon */}
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-100">
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

          <h2 className="text-xl font-bold text-slate-900 mb-2">
            {t('tokenInvalidTitle')}
          </h2>
          <p className="text-sm text-slate-500 mb-6 leading-relaxed">
            {t('tokenInvalidDesc')}
          </p>

          <div className="space-y-3">
            <Link
              href="/forgot-password"
              className="block w-full bg-brand hover:bg-brand-strong text-white text-sm font-semibold py-3 rounded-lg transition-colors text-center shadow-xs"
            >
              {t('requestNewLink')}
            </Link>

            <Link
              href="/login"
              className="inline-block text-sm font-semibold text-slate-600 hover:text-slate-900 hover:underline transition-colors"
            >
              {t('backLogin')}
            </Link>
          </div>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell title={t('authHero')}>
      <h2 className="text-2xl sm:text-[20px] sm:leading-[1.3] font-bold text-slate-900 mb-8">
        {t('resetPassword')}
      </h2>
      <ResetForm token={token} email={verification.email} />
    </AuthShell>
  );
}
