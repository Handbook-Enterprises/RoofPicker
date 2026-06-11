// Rewrite breadcrumb hrefs that would 404 to the nearest existing parent hub.

export interface Crumb {
  label: string;
  url: string | null;
}

export function fixBreadcrumbUrl(url: string | null | undefined): string | null {
  if (!url) return url ?? null;

  // Strategy 5 style landings: /<style>-homes/ -> /home-styles/#<style>
  const styleMatch = url.match(/^\/([a-z][a-z0-9-]*)-homes\/?$/);
  if (styleMatch) return `/home-styles/#${styleMatch[1]}`;

  // Brand + brand-line landings: /shingles/<brand>[/<line>]/ -> /shingles/#<brand>.
  const brandMatch = url.match(/^\/shingles\/([a-z][a-z0-9-]*)(?:\/[a-z0-9-]+)?\/?$/);
  if (brandMatch) return `/shingles/#${brandMatch[1]}`;

  return url;
}

export function fixBreadcrumb(crumbs: Crumb[] | null | undefined): Crumb[] {
  if (!Array.isArray(crumbs)) return [];
  return crumbs.map((c) => ({ ...c, url: fixBreadcrumbUrl(c.url) }));
}
