import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import ForgotForm from "@/components/auth/forgot-form";

export const metadata = { title: "Lupa Password" };

export default function ForgotPage() {
  return (
    <AuthShell title="Lupa password" subtitle="Link reset berlaku 1 jam. Password lama langsung invalid setelah reset (PRD F1)." footer={<><Link href="/login" className="font-semibold text-brand hover:underline">Kembali ke masuk</Link></>}>
      <ForgotForm />
    </AuthShell>
  );
}
