/**
 * Extract latitude/longitude from common Google Maps URL shapes.
 * Short links (maps.app.goo.gl) must be expanded first — use `npm run resolve-map-coords`.
 */
export function parseGoogleMapsCoordinates(url: string): { lat: number; lng: number } | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  const decoded = decodeURIComponent(url.trim());

  const patterns: RegExp[] = [
    /@(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,|\?|\/|$)/,
    /%40(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)(?:,|\?|\/|$)/,
    /!3d(-?\d+(?:\.\d+)?)!4d(-?\d+(?:\.\d+)?)/,
    /[?&]q=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]ll=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
    /[?&]query=(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/,
  ];

  for (const pattern of patterns) {
    const match = decoded.match(pattern);
    if (!match) {
      continue;
    }
    const lat = Number.parseFloat(match[1]);
    const lng = Number.parseFloat(match[2]);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return { lat, lng };
    }
  }

  return null;
}

export function isValidCoordinate(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

/** Fix share links for href use (apostrophes, missing protocol, tracking params). */
export function normalizeGoogleMapsUrl(url: string): string {
  if (!url || typeof url !== 'string') {
    return '';
  }

  let fixed = url.trim();
  if (!/^https?:\/\//i.test(fixed)) {
    fixed = `https://${fixed.replace(/^\/\//, '')}`;
  }

  fixed = fixed.replace(/'/g, '%27').replace(/\u2019/g, '%27');

  fixed = fixed.replace(/([?&])(?:g_ep|skid|entry)=[^&]*/g, '');
  fixed = fixed.replace(/\?&/, '?').replace(/[?&]$/, '');

  return fixed;
}
