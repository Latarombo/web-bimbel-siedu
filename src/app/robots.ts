import type { MetadataRoute } from "next";

/*
 * Robots: izinkan halaman publik dan blokir seluruh area yang butuh auth.
 * Area personal (/home, /teacher, /admin) tidak boleh masuk indeks karena isinya
 * datamurid, nilai, dan pembayaran. /api juga diblokir karena tidak relevan
 * untuk mesin pencari.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/api/",
          "/home",
          "/children",
          "/enrollments",
          "/payments",
          "/profile",
          "/schedule-attendance",
          "/teacher/",
          "/admin/",
        ],
      },
    ],
    sitemap: "https://siedu.id/sitemap.xml",
    host: "https://siedu.id",
  };
}