export type Locale = 'en' | 'ru';

export const DEFAULT_LOCALE: Locale = 'en';
export const LOCALES: Locale[] = ['en', 'ru'];

export function getLocaleFromPath(pathname: string): Locale {
  return pathname === '/ru' || pathname.startsWith('/ru/') ? 'ru' : 'en';
}

/** Derive locale from a full page URL (e.g. RSVP referer). */
export function getLocaleFromUrl(url: string): Locale {
  if (!url) return DEFAULT_LOCALE;
  try {
    return getLocaleFromPath(new URL(url).pathname);
  } catch {
    return DEFAULT_LOCALE;
  }
}

/** Prefix a site path with locale (English paths stay unprefixed). */
export function localizePath(path: string, locale: Locale): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const withSlash = normalized.endsWith('/') ? normalized : `${normalized}/`;

  if (locale === DEFAULT_LOCALE) {
    return withSlash;
  }

  if (withSlash === '/') {
    return '/ru/';
  }

  return `/ru${withSlash}`;
}

/** Toggle between English and Russian for the current path. */
export function switchLocalePath(pathname: string): string {
  const locale = getLocaleFromPath(pathname);
  const target = locale === 'en' ? 'ru' : 'en';

  if (locale === 'ru') {
    const stripped = pathname.replace(/^\/ru/, '') || '/';
    return localizePath(stripped, target);
  }

  return localizePath(pathname, target);
}

export function localeLang(locale: Locale): string {
  return locale === 'ru' ? 'ru' : 'en';
}

export const FLAG_ASSETS = {
  ru: '/assets/flags/ru.svg',
  us: '/assets/flags/us.svg',
} as const;

export function switcherFlagSrc(locale: Locale): string {
  return locale === 'ru' ? FLAG_ASSETS.us : FLAG_ASSETS.ru;
}

export function switcherAriaLabel(locale: Locale): string {
  return locale === 'ru' ? 'Переключить на английский' : 'Switch to Russian';
}
