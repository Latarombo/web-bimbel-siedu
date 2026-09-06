import { AuthShell } from "@/components/auth-shell";
import AccountInfoForm from "@/components/auth/account-info-form";

export const metadata = { title: "Lengkapi Alamat" };

export default function AccountInfoPage() {
  return (
    <AuthShell title="Lengkapi alamat — langkah 2 dari 3" subtitle="BR#25: alamat & nomor telepon disimpan di users.">
      <div className="mb-4 flex gap-1.5">
        <span className="h-1.5 flex-1 rounded-full bg-emerald-500" /><span className="h-1.5 flex-1 rounded-full bg-brand" /><span className="h-1.5 flex-1 rounded-full bg-slate-200" />
      </div>
      <AccountInfoForm />
    </AuthShell>
  );
}
