import Link from 'next/link';
import Image from 'next/image';
import { getLang } from '@/lib/get-lang';
import { chrome } from '@/lib/i18n';
import { LanguageSwitcher } from '@/components/language-switcher';

const Footer = async () => {
  const lang = await getLang();
  const t = chrome[lang].footer;
  // Jenjang → halaman kelas + filter (route nyata).
  const programBelajar = [
    { name: 'TK', href: '/classes?jenjang=TK' },
    { name: 'SD', href: '/classes?jenjang=SD' },
    { name: 'SMP', href: '/classes?jenjang=SMP' },
    { name: 'SMA', href: '/classes?jenjang=SMA' },
  ];

  const perusahaan = [
    { name: t.companyLinks[0], href: '/about' },
    { name: t.companyLinks[1], href: '/career' },
    { name: t.companyLinks[2], href: '/teachers' },
    { name: t.companyLinks[3], href: '/blog' },
    { name: t.companyLinks[4], href: '/testimonial' },
  ];

  const bantuan = [
    { name: t.helpLinks[0], href: '/faq' },
    { name: t.helpLinks[1], href: '/privacy-policy' },
    { name: t.helpLinks[2], href: '/terms' },
    { name: t.helpLinks[3], href: '/contact' },
  ];

  const sosial = [
    {
      nama: 'Instagram',
      href: 'https://instagram.com',
      label: 'Instagram',
      lingkar: 'bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600',
      path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
    },
    {
      nama: 'X (Twitter)',
      href: 'https://twitter.com',
      label: 'X (Twitter)',
      lingkar: 'bg-black',
      path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
    },
    {
      nama: 'LinkedIn',
      href: 'https://linkedin.com',
      label: 'LinkedIn',
      lingkar: 'bg-[#0A66C2]',
      path: 'M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z',
    },
    {
      nama: 'TikTok',
      href: 'https://tiktok.com',
      label: 'TikTok',
      lingkar: 'bg-black',
      path: 'M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z',
    },
    {
      nama: 'Facebook',
      href: 'https://facebook.com',
      label: 'Facebook',
      lingkar: 'bg-[#1877F2]',
      path: 'M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z',
    },
    {
      nama: 'YouTube',
      href: 'https://youtube.com',
      label: 'YouTube',
      lingkar: 'bg-[#FF0000]',
      path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
    },
  ];

  return (
    <footer className="bg-white border-t border-gray-200">
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        {/* Grid responsif: brand full di mobile, 2 kolom grup link di sm, 12-grid penuh di lg */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-12 lg:gap-12">
          {/* Column 1: Brand & Contact */}
          <div className="sm:col-span-2 lg:col-span-5">
            {/* Logo */}
            <Link href="/" className="inline-flex items-center" aria-label="Siedu — beranda">
              <Image src="/images/Logo.png" alt="Siedu" width={140} height={42} className="h-9 w-auto" />
            </Link>

            {/* Description */}
            <p className="mt-5 text-sm leading-relaxed text-gray-600 max-w-sm">
              {t.desc}
            </p>

            {/* Contact Info */}
            <ul className="mt-7 space-y-3.5 text-sm">
              {/* Phone */}
              <li className="flex items-center space-x-3">
                <svg
                  className="w-5 h-5 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <a href="tel:+6281122334455" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                  +62 811 2233 4455
                </a>
              </li>

              {/* Email */}
              <li className="flex items-center space-x-3">
                <svg
                  className="w-5 h-5 text-gray-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
                <a href="mailto:halo@siedu.id" className="text-gray-600 hover:text-blue-600 transition-colors duration-200">
                  halo@siedu.id
                </a>
              </li>

              {/* Address */}
              <li className="flex items-start space-x-3">
                <svg
                  className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <span className="text-gray-600">
                  Gedung Pendidikan Lt. 4
                  <br />
                  Jl. Jend. Sudirman Kav 1
                  <br />
                  Jakarta Selatan 12190
                </span>
              </li>
            </ul>
          </div>

          {/* Column 2: Program Belajar */}
          <nav aria-label={t.program} className="lg:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-900">
              {t.program}
            </h3>
            <ul className="mt-5 space-y-3.5 text-sm">
              {programBelajar.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/classes"
                  className="text-blue-600 font-medium hover:text-blue-700 transition-colors duration-200 inline-flex items-center space-x-1"
                >
                  <span>{t.viewAll}</span>
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 8l4 4m0 0l-4 4m4-4H3"
                    />
                  </svg>
                </Link>
              </li>
            </ul>
          </nav>

          {/* Column 3: Perusahaan */}
          <nav aria-label={t.company} className="lg:col-span-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-900">
              {t.company}
            </h3>
            <ul className="mt-5 space-y-3.5 text-sm">
              {perusahaan.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Column 4: Bantuan */}
          <nav aria-label={t.help} className="lg:col-span-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-900">
              {t.help}
            </h3>
            <ul className="mt-5 space-y-3.5 text-sm">
              {bantuan.map((item) => (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className="text-gray-600 hover:text-blue-600 transition-colors duration-200"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      </div>

      {/* Bottom Footer */}
      <div className="border-t border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-5 md:gap-4">
            {/* Copyright */}
            <p className="text-gray-500 text-sm order-last md:order-first">
              {t.rights}
            </p>

            {/* Right Side: Language + Social Media */}
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              {/* Language Dropdown */}
              <LanguageSwitcher current={lang} />

              {/* Social Media Icons */}
              <ul className="flex flex-wrap items-center justify-center gap-2.5">
                {sosial.map((s) => (
                  <li key={s.nama}>
                    <a
                      href={s.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`w-10 h-10 rounded-full ${s.lingkar} flex items-center justify-center hover:opacity-80 transition-opacity`}
                      aria-label={s.label}
                    >
                      <svg
                        className="w-[18px] h-[18px] text-white"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                        xmlns="http://www.w3.org/2000/svg"
                        aria-hidden="true"
                      >
                        <path d={s.path} />
                      </svg>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
