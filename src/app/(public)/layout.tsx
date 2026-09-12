import Navbar from "@/components/LandingNavbar";
import Footer from "@/components/Footer";
import { auth } from "@/lib/auth";
import { getLang } from "@/lib/get-lang";

export default async function PublicLayout({ children }: { children: React.ReactNode }) {
  // UX (ui-ux-pro-max Navigation/Active State): state user harus terlihat —
  // yang sudah login tidak boleh tetap diperlihatkan tombol Login/Sign Up.
  const [session, lang] = await Promise.all([auth(), getLang()]);
  const role = session?.user?.role;
  const dashboardHref =
    role === "admin" ? "/admin/dashboard" : role === "guru" ? "/teacher/dashboard" : role === "orang_tua" ? "/home" : null;

  return (
    <>
      <Navbar dashboardHref={dashboardHref} lang={lang} />
      <main id="main" className="flex-1">{children}</main>
      <Footer />
    </>
  );
}
