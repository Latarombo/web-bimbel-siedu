import { createNavigation } from 'next-intl/navigation';
import { routing } from './routing';

/**
 * Pengganti next/link, next/router, next/navigation.
 * Semuanya otomatis menambahkan prefix locale (/en/...), dan default locale
 * tetap tanpa prefix karena mode 'as-needed'.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing);
