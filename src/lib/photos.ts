import { parse as parseYaml } from 'yaml';
import photosYaml from '../data/photos.yaml?raw';

export type PhotoSlot = {
  file: string;
  alt?: string;
};

export type PhotosManifest = {
  slots: Record<string, PhotoSlot>;
  brand: {
    navOnLightBackground: string;
    navOnDarkBackground: string;
  };
};

const manifest = parseYaml(photosYaml) as PhotosManifest;

/** Public URL for an asset under /assets/ */
export function assetUrl(relativePath: string): string {
  const clean = relativePath.replace(/^\//, '').replace(/^assets\//, '');
  return `/assets/${clean}`;
}

export function getPhotoSlot(slotId: string): PhotoSlot | undefined {
  return manifest.slots[slotId];
}

export function getPhotoUrl(slotId: string): string {
  const slot = getPhotoSlot(slotId);
  if (!slot?.file) return '';
  return assetUrl(slot.file);
}

/** Home hero — separate mobile slot falls back to desktop when unset. */
export function getHeroBackgroundUrls(): { desktop: string; mobile: string } {
  return getResponsivePhotoUrls('home.heroBackground');
}

/** Desktop slot + optional `{slotId}Mobile` companion; mobile falls back to desktop when unset. */
export function getResponsivePhotoUrls(
  slotId: string
): { desktop: string; mobile: string } {
  const desktop = getPhotoUrl(slotId);
  const mobileSlot = getPhotoSlot(`${slotId}Mobile`);
  const mobile = mobileSlot?.file ? getPhotoUrl(`${slotId}Mobile`) : desktop;
  return { desktop, mobile };
}

export const brandNavDark = assetUrl(manifest.brand.navOnLightBackground);
export const brandNavLight = assetUrl(manifest.brand.navOnDarkBackground);
export const brandHeroWordmark = getPhotoUrl('home.heroWordmark');

export function getManifest(): PhotosManifest {
  return manifest;
}

/** Normalize optional inline HTML from YAML content fields. */
export function normalizeProseHtml(html: string): string {
  return html?.trim() ?? '';
}

/** @deprecated Use normalizeProseHtml */
export const fixContentUrls = normalizeProseHtml;
