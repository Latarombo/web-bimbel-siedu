import { getLocale, getTranslations } from "next-intl/server";
import { redirect, getPathname } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { AdminShell } from "@/components/admin/admin-shell";
import type { NavSection } from "@/components/admin/admin-sidebar";
import type { AdminNotificationItem } from "@/components/admin/admin-header";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = await getTranslations("admin");
  const session = await auth();
  if (!session?.user) return redirect({ href: { pathname: "/login", query: { next: getPathname({ href: "/admin/dashboard", locale }) } }, locale });
  // Tembok dalam: proxy cek role admin untuk /admin/*; dicek di sini lagi (lapis kedua).
  if (session.user.role !== "admin") {
    return redirect({ href: session.user.role === "guru" ? "/teacher/dashboard" : "/home", locale });
  }

  // Scan ringan; tabel skala lembaga (ratusan baris), bukan jutaan.
  const [pendaftaran, pesanBaru] = await Promise.all([
    collect(db.orm.public.Pendaftaran.all()),
    collect(db.orm.public.PesanKontak.where((p) => p.status.eq("baru")).all()),
  ]);
  const nTunggakan = pendaftaran.filter((p) => p.status === "tertunggak").length;
  const nMenungguBayar = pendaftaran.filter((p) => p.status === "menunggu_pembayaran").length;

  // Notifikasi header — diturunkan dari antrean nyata, sama seperti teacher.
  const notifications: AdminNotificationItem[] = [];
  if (nTunggakan > 0) {
    notifications.push({
      id: "admin-overdue",
      title: t("text22"),
      description: t("overdueCount", { count: nTunggakan }),
      time: t("text111"),
      unread: true,
      category: "payment",
      href: "/admin/enrollments/flagged?status=tertunggak",
    });
  }
  if (nMenungguBayar > 0) {
    notifications.push({
      id: "admin-awaiting-payment",
      title: t("text24"),
      description: t("awaitingPaymentCount", { count: nMenungguBayar }),
      time: t("text111"),
      unread: true,
      category: "payment",
      href: "/admin/enrollments?status=menunggu_pembayaran",
    });
  }
  if (pesanBaru.length > 0) {
    notifications.push({
      id: "admin-new-messages",
      title: t("text28"),
      description: t("newMessageCount", { count: pesanBaru.length }),
      time: t("text111"),
      unread: true,
      category: "message",
      href: "/admin/messages?status=baru",
    });
  }

  // Grup nav: Operasional (antrean kerja) / Data Master / Komunikasi & Laporan.
  const NAV_SECTIONS: NavSection[] = [
    {
      label: t("text1"),
      items: [
        { name: t("text2"), href: "/admin/dashboard", icon: "grid" },
        {
          name: t("text3"),
          href: "/admin/enrollments",
          icon: "clipboard",
        },
        { name: t("payments"), href: "/admin/payments", icon: "creditCard" },
        { name: t("scheduleMaster"), href: "/admin/schedule", icon: "clock" },
      ],
    },
    {
      label: t("text7"),
      items: [
        { name: t("text11"), href: "/admin/classes", icon: "layers" },
        { name: t("text9"), href: "/admin/periods", icon: "calendar" },
        { name: t("text10"), href: "/admin/teachers", icon: "users" },
        { name: t("parents"), href: "/admin/parents", icon: "userCheck" },
        { name: t("students"), href: "/admin/students", icon: "graduation" },
      ],
    },
    {
      label: t("text12"),
      items: [
        { name: t("text13"), href: "/admin/messages", icon: "mail" },
        { name: t("text14"), href: "/admin/reports", icon: "chart" },
        { name: t("auditLogs"), href: "/admin/audit-logs", icon: "history" },
      ],
    },
  ];

  return (
    <AdminShell
      role="Admin"
      userName={session.user.name ?? "Admin"}
      userEmail={session.user.email ?? null}
      accountRole={session.user.role}
      navSections={NAV_SECTIONS}
      notifications={notifications}
    >
      {children}
    </AdminShell>
  );
}
