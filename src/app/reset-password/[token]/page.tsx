import { AuthShell } from "@/components/auth-shell";
import ResetForm from "@/components/auth/reset-form";

export async function generateMetadata({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return { title: `Reset Password — ${token.slice(0, 8)}…` };
}

export default async function ResetPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <AuthShell title="Reset password" subtitle="Token dari email. Kalau expired (24 jam verifikasi / 1 jam reset), minta ulang.">
      <ResetForm token={token} />
    </AuthShell>
  );
}
