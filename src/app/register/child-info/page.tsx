import { AuthShell } from "@/components/auth-shell";
import ChildInfoForm from "@/components/auth/child-info-form";

export const metadata = { title: "Profil Anak" };

export default function ChildInfoPage() {
  return (
    <AuthShell title="Profil anak — langkah 3 dari 3" subtitle="Bisa tambah banyak anak nanti di /children. Jenjang dipakai filter kelas (BR#13).">
      <div className="mb-4 flex gap-1.5">
        <span className="h-1.5 flex-1 rounded-full bg-emerald-500" /><span className="h-1.5 flex-1 rounded-full bg-emerald-500" /><span className="h-1.5 flex-1 rounded-full bg-brand" />
      </div>
      <ChildInfoForm />
    </AuthShell>
  );
}
