import { locale as localeParam } from 'next/root-params';
import { getRequestConfig } from 'next-intl/server';
import { isLocale, routing } from './routing';

import commonId from './messages/id/common.json';
import commonEn from './messages/en/common.json';
import chromeId from './messages/id/chrome.json';
import chromeEn from './messages/en/chrome.json';
import aboutId from './messages/id/about.json';
import aboutEn from './messages/en/about.json';
import adminId from './messages/id/admin.json';
import adminFormsId from './messages/id/adminForms.json';
import authId from './messages/id/auth.json';
import parentId from './messages/id/parent.json';
import publicId from './messages/id/public.json';
import sharedId from './messages/id/shared.json';
import teacherId from './messages/id/teacher.json';
import adminEn from './messages/en/admin.json';
import adminFormsEn from './messages/en/adminForms.json';
import authEn from './messages/en/auth.json';
import parentEn from './messages/en/parent.json';
import publicEn from './messages/en/public.json';
import sharedEn from './messages/en/shared.json';
import teacherEn from './messages/en/teacher.json';


/**
 * Satu pintu masuk kamus per request.
 *
 * Locale dibaca dari segmen [locale] lewat next/root-params (Next >= 16.3),
 * bukan dari header/cookie: itu yang membuat rute tetap bisa static rendering
 * dan tanpa API legacy setRequestLocale di setiap layout.
 *
 * Impor per namespace eksplisit (bukan glob) supaya identik di webpack maupun
 * Turbopack. JSON hanya dimuat di server: browser menerima hasil render, bukan
 * kamusnya.
 */
const catalogs = {
  id: { common: commonId, chrome: chromeId, about: aboutId, admin: adminId, adminForms: adminFormsId, auth: authId, parent: parentId, public: publicId, shared: sharedId, teacher: teacherId },
  en: { common: commonEn, chrome: chromeEn, about: aboutEn, admin: adminEn, adminForms: adminFormsEn, auth: authEn, parent: parentEn, public: publicEn, shared: sharedEn, teacher: teacherEn },
} as const;

export default getRequestConfig(async () => {
  let raw: string;
  try {
    raw = await localeParam();
  } catch {
    // Route di luar [locale] (mis. not-found global) tidak punya segmen ini.
    raw = routing.defaultLocale;
  }
  const locale = isLocale(raw) ? raw : routing.defaultLocale;
  return { locale, messages: catalogs[locale] };
});
