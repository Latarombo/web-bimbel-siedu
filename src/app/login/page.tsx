import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import LoginForm from "@/components/auth/login-form";

export const metadata = { title: "Masuk" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string }> }) {
  const { next } = await searchParams;
  return (
    <AuthShell title="Masuk ke Siedu" subtitle="Satu akun orang tua kelola banyak anak. Guru & admin login dengan akun yang dibuat admin." footer={<>Belum punya akun? <Link href="/register" className="font-semibold text-brand hover:underline">Daftar</Link></>}>
      <LoginForm next={next} />
    </AuthShell>
  );
}
