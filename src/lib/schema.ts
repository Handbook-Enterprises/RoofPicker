// JSON-LD builders. Pass returned objects into BaseLayout's jsonLd prop.

interface Crumb { label: string; url: string | null }

const SITE_URL = import.meta.env.PUBLIC_SITE_URL || 'https://getroofreport.com';

function absolute(urlOrPath: string): string {
  if (!urlOrPath) return SITE_URL;
  return urlOrPath.startsWith('http') ? urlOrPath : `${SITE_URL}${urlOrPath}`;
}

export function breadcrumbList(items: Crumb[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.label,
      ...(it.url ? { item: absolute(it.url) } : {}),
    })),
  };
}

export function faqPage(items: Array<{ q: string; a: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((qa) => ({
      '@type': 'Question',
      name: qa.q,
      acceptedAnswer: { '@type': 'Answer', text: qa.a },
    })),
  };
}

interface ProductSchemaInput {
  name: string;
  brand: string;
  sku: string;
  description: string;
  images: Array<string | null | undefined>;
  pricingCard?: { low_usd?: number; high_usd?: number } | null;
  ratings?: { hailClass?: number | null; windMph?: string | null };
}

export function product(input: ProductSchemaInput) {
  const images = input.images.filter(Boolean) as string[];
  const offers = input.pricingCard && input.pricingCard.low_usd && input.pricingCard.high_usd
    ? {
        '@type': 'AggregateOffer',
        priceCurrency: 'USD',
        lowPrice: input.pricingCard.low_usd,
        highPrice: input.pricingCard.high_usd,
      }
    : undefined;
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    sku: input.sku,
    brand: { '@type': 'Brand', name: input.brand },
    description: input.description,
    ...(images.length ? { image: images } : {}),
    ...(offers ? { offers } : {}),
  };
}

export function imageGallery(name: string, urlPath: string, images: Array<string | null | undefined>) {
  const filtered = images.filter(Boolean) as string[];
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageGallery',
    name,
    url: absolute(urlPath),
    image: filtered.map((url) => ({
      '@type': 'ImageObject',
      contentUrl: url,
    })),
  };
}

export function softwareApplication() {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'RoofPicker Visualizer',
    applicationCategory: 'DesignApplication',
    operatingSystem: 'Web',
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };
}
