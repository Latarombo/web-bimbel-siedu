import Image from 'next/image';
import { HelpCircle } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { LanguageSwitcher } from '@/components/language-switcher';

/*
 * Bar atas halaman layar penuh bernuansa biru (login, register, forgot,
 * tambah/edit anak). Sebelumnya markup ini disalin verbatim di 5 tempat
 * (3 shell + 2 halaman children); satu sumber supaya perubahan tidak diulang.
 */
export default async function AuthTopBar({
    homeHref = '/',
}: {
    homeHref?: string;
}) {
    const t = await getTranslations('auth');

    return (
        <header className="flex justify-between items-center px-4 py-5 sm:px-6 lg:px-8 z-10 w-full">
            <Link href={homeHref} className="flex items-center" aria-label={t('homeAria')}>
                <Image
                    src="/images/Logo-white.png"
                    alt="Siedu"
                    width={110}
                    height={33}
                    className="h-7 w-auto"
                    priority
                />
            </Link>

            <div className="flex items-center gap-2.5 sm:gap-3">
                <Link
                    href="/#faq"
                    className="flex items-center space-x-2 bg-white text-gray-800 px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl font-medium hover:bg-gray-100 transition-colors shadow-md text-xs sm:text-sm"
                >
                    <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" aria-hidden />
                    <span>{t('help')}</span>
                </Link>
                <LanguageSwitcher variant="auth" placement="bottom" align="right" />
            </div>
        </header>
    );
}
