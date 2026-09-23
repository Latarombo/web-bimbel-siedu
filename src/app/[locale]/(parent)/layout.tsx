import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import DashboardNavbar from "@/components/DashboardNavbar";
import { AKUN_INFO_PATH, orangTuaBelumLengkap } from "@/lib/orang-tua-lengkap";

export default async function ParentLayout({ children }: { children: React.ReactNode }) {
 const tr = await getTranslations("parent");
 const locale = await getLocale();
 const session = await auth();
 if (!session?.user) {
   return redirect({href: "/login?next=/home", locale});
 }
 // Tembok dalam: proxy cuma cek login utk rute parent; role dicek di sini lagi.
 if (session.user.role !== "orang_tua") {
 redirect({href: session.user.role === "guru" ? "/teacher/dashboard" : "/admin/dashboard", locale});
 }
 // Akun berhenti di tengah wizard (mis. ortu kabur dari /register/account-info
 // ke /home) → kembalikan ke step 2 sebelum dashboard mana pun bisa dibuka.
 // ?lengkap=1 supaya halaman step 2 bisa menjelaskan kenapa user ditendang.
 if (await orangTuaBelumLengkap(Number(session.user.id))) {
 redirect({href: `${AKUN_INFO_PATH}?lengkap=1`, locale});
 }

  return (
    <>
      <DashboardNavbar
        role={tr("text079")}
        userName={session.user.name ?? tr("text079")}
        userEmail={session.user.email}
        accountRole={session.user.role}
        profileVariant="popover"
        navItems={[
          { name: tr("text144"), href: "/home" },
          { name: tr("text145"), href: "/classes" },
          { name: tr("navChildren"), href: "/children" },
          { name: tr("text146"), href: "/payments" },
          { name: tr("text147"), href: "/schedule-attendance" },
        ]}
      />
      <main id="main" className="flex-1">{children}</main>
    </>
  );
}
