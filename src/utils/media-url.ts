/**
 * Central place for API media URL strings. Transformations (CDN, resizing) can be added later.
 * Today: pass-through trim (same observable URL as stored).
 */
export function mediaResponseUrl(url: string | null | undefined): string {
  if (url == null || typeof url !== "string") return "";
  return url.trim();
}
