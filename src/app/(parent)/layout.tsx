import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import DashboardNavbar from "@/components/DashboardNavbar";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/home");
  // Tembok dalam: proxy cuma cek login utk rute parent; role dicek di sini lagi.
  if (session.user.role !== "orang_tua") {
    redirect(session.user.role === "guru" ? "/teacher/dashboard" : "/admin/dashboard");
  }

  return (
    <>
      <DashboardNavbar
        role="Orang Tua"
        userName={session.user.name ?? "Orang Tua"}
        profileVariant="popover"
        navItems={[
          { name: "Home", href: "/home", icon: "home" },
          { name: "Browse Classes", href: "/classes", icon: "search" },
          { name: "Payments", href: "/payments", icon: "credit" },
          { name: "Schedule & Attendance", href: "/schedule-attendance", icon: "calendar" },
        ]}
      />
      <main id="main" className="flex-1">{children}</main>
    </>
  );
}
