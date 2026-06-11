// Image URL resolver. Returns the stamped image_cdn_url or ''.
// Callers should hide the <img> on empty result.

interface ImageRef {
  image_local_path?: string | null;
  image_cdn_url?: string | null;
  image_filename?: string;
}

/** Reject private R2 S3 endpoint URLs (anonymous GETs 401). */
function isPublicCdnUrl(url: string): boolean {
  if (!url) return false;
  if (url.includes('.r2.cloudflarestorage.com')) return false;
  return /^https?:\/\//.test(url);
}

/** Resolve an image ref to its public CDN URL, or '' if missing. */
export function imageSrc(ref: ImageRef | null | undefined): string {
  if (!ref) return '';
  if (ref.image_cdn_url && isPublicCdnUrl(ref.image_cdn_url)) {
    return ref.image_cdn_url;
  }
  return '';
}

export function safeAlt(ref: ImageRef | null | undefined, fallback: string): string {
  if (!ref) return fallback;
  const a = (ref as { alt?: string }).alt;
  return (a && a.length > 0) ? a : fallback;
}
