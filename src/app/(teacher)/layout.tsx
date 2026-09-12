import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import DashboardNavbar from "@/components/DashboardNavbar";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/teacher/dashboard");
  // Tembok dalam: role guru dicek ulang di layout (proxy sudah guard /teacher).
  if (session.user.role !== "guru") {
    redirect(session.user.role === "admin" ? "/admin/dashboard" : "/home");
  }

  return (
    <>
      <DashboardNavbar
        role="Guru"
        userName={session.user.name ?? "Guru"}
        navItems={[
          { name: "Home", href: "/teacher/dashboard" },
          { name: "Kelas Diampu", href: "/teacher/classes" },
          { name: "Nilai & Progres", href: "/teacher/grades" },
          { name: "Koreksi", href: "/teacher/corrections" },
        ]}
      />
      <main id="main" className="flex-1">{children}</main>
    </>
  );
}
