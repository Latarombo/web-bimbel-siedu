import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import AdminSidebar from "@/components/admin/AdminSidebar";

// Ikon per menu admin — kunci ke ICONS di AdminSidebar (feather-style inline).
// Duplicate-children & reports masuk grup Review (ikon copy/chart/file).
const ADMIN_NAV = [
  { name: "Dashboard", href: "/admin/dashboard", icon: "grid" },
  { name: "Subjects", href: "/admin/subjects", icon: "book" },
  { name: "Periods", href: "/admin/periods", icon: "calendar" },
  { name: "Teachers", href: "/admin/teachers", icon: "users" },
  { name: "Classes", href: "/admin/classes", icon: "layers" },
  { name: "Refunds", href: "/admin/refunds", icon: "inbox" },
  { name: "Corrections", href: "/admin/corrections", icon: "check" },
  { name: "Duplikat", href: "/admin/duplicate-children", icon: "copy" },
  { name: "Laporan", href: "/admin/reports", icon: "chart" },
];

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/admin/dashboard");
  // Tembok dalam: proxy cek role admin untuk /admin/*; dicek di sini lagi (lapis kedua).
  if (session.user.role !== "admin") {
    redirect(session.user.role === "guru" ? "/teacher/dashboard" : "/home");
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <AdminSidebar role="Admin" userName={session.user.name ?? "Admin"} navItems={ADMIN_NAV} />
      <main id="main" className="lg:pl-64">
        {children}
      </main>
    </div>
  );
}
