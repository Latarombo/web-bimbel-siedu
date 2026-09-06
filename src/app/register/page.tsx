import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import RegisterForm from "@/components/auth/register-form";

export const metadata = { title: "Daftar" };

export default function RegisterPage() {
  return (
    <AuthShell title="Daftar — langkah 1 dari 3" subtitle="Email & password dulu. Lanjut alamat, lalu profil anak. 2 consent wajib (BR#25)." footer={<>Sudah punya akun? <Link href="/login" className="font-semibold text-brand hover:underline">Masuk</Link></>}>
      <div className="mb-4 flex gap-1.5">
        <span className="h-1.5 flex-1 rounded-full bg-brand" /><span className="h-1.5 flex-1 rounded-full bg-slate-200" /><span className="h-1.5 flex-1 rounded-full bg-slate-200" />
      </div>
      <RegisterForm />
    </AuthShell>
  );
}
