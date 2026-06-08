/**
 * Runtime env — Railway injects vars at runtime; Vite may bake import.meta.env at build time.
 */
export function getEnv(name: string): string {
  const fromProcess = typeof process !== 'undefined' ? process.env[name] : undefined;
  const value = fromProcess ?? import.meta.env[name];
  return typeof value === 'string' ? value.trim() : '';
}

export function getGoogleMapsApiKey(): string {
  return getEnv('PUBLIC_GOOGLE_MAPS_API_KEY');
}
