/**
 * Runtime env for values that must not be baked in at build time (e.g. Railway deploy).
 * Vite inlines import.meta.env.PUBLIC_* at build; process.env is read when the page renders.
 */
export function getGoogleMapsApiKey(): string {
  const fromProcess =
    typeof process !== 'undefined' ? process.env.PUBLIC_GOOGLE_MAPS_API_KEY : undefined;
  return (fromProcess || import.meta.env.PUBLIC_GOOGLE_MAPS_API_KEY || '').trim();
}
