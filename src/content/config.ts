// Zod schemas for each strategy's enriched JSON. Upstream drift fails the build.

import { defineCollection, z } from 'astro:content';

// ---------- shared fragments ----------
const sourceRef = z.object({
  label: z.string(),
  url:   z.string(),
});

const imageTile = z.object({
  image_local_path: z.string().nullable().optional(),
  image_cdn_url:    z.string().url().nullable().optional(),
  image_filename:   z.string().optional(),
  alt:              z.string().optional(),
  tag:              z.string().optional(),
  source:           z.string().optional(),
  sku_url:          z.string().nullable().optional(),
  source_page_url:  z.string().nullable().optional(),
  angle_slug:       z.string().optional(),
});

const breadcrumbItem = z.object({
  label: z.string(),
  url:   z.string().nullable(),
});

const visualizerPayload = z.object({
  brand:   z.string().optional(),
  line:    z.string().optional(),
  color:   z.string().optional(),
  context: z.string().optional(),
  house:   z.string().optional(),
  roof:    z.string().optional(),
  style:   z.string().optional(),
  color_filter: z.string().optional(),
  preload_sku: z.object({
    brand: z.string(),
    line:  z.string(),
    color: z.string(),
  }).nullable().optional(),
}).passthrough();

// ---------- S3 SKU ----------
const skuSchema = z.object({
  slug: z.string(),
  url_path: z.string(),
  h1: z.string(),
  meta_title: z.string(),
  meta_description: z.string(),
  strategy: z.literal(3),
  color_family: z.string().nullable(),
  roof_archetype: z.string().nullable(),
  best_for_styles: z.array(z.string()),
  hail_rating_class: z.number().int().nullable(),

  sku_hero: z.object({
    kicker: z.string(),
    brand_display: z.string(),
    brand_slug:    z.string(),
    brand_url:     z.string(),
    line_display:  z.string(),
    line_slug:     z.string(),
    line_url:      z.string(),
    color_display: z.string(),
    color_slug:    z.string(),
    h1_html:  z.string(),
    tagline:  z.string(),
    hex:      z.string(),
    hero_image_local_path: z.string().nullable(),
    hero_image_cdn_url:    z.string().url().nullable(),
    hero_image_alt: z.string(),
    quick_facts: z.array(z.object({ label: z.string(), val: z.string() })),
    breadcrumb:  z.array(breadcrumbItem),
    visualizer_payload: visualizerPayload,
  }),

  color_desc: z.object({
    kicker: z.string(),
    title_html: z.string(),
    prose_paragraphs: z.array(z.string()),
    swatch_meta: z.object({
      hex:       z.string(),
      family:    z.string(),
      undertone: z.string(),
      best_in:   z.string(),
    }),
    hex_blend: z.array(z.string()),
    swatch_image: z.object({
      image_local_path: z.string(),
      image_cdn_url:    z.string().url().nullable(),
      image_filename:   z.string(),
      source:           z.string(),
      origin_filename:  z.string().optional(),
    }).nullable(),
    sources: z.array(sourceRef),
  }),

  specs: z.object({
    kicker: z.string(),
    title_html: z.string(),
    rows: z.array(z.object({ cat: z.string(), val: z.string(), ctx: z.string() })),
    docs: z.array(z.object({ label: z.string(), url: z.string(), type: z.string() })),
    sources: z.array(sourceRef),
  }),

  gallery: z.object({
    title_html: z.string(),
    meta: z.string(),
    tiles: z.array(imageTile),
    tiles_total: z.number().int().optional(),
    display_limit_default: z.number().int().optional(),
    image_library_path: z.string().optional(),
  }),

  pairs: z.object({
    kicker: z.string(),
    title_html: z.string(),
    items: z.array(z.object({
      color_name: z.string(),
      color_hex:  z.string(),
      kicker:     z.string(),
      house_color_slug: z.string().optional(),
      url:        z.string().nullable(),
    })),
    note: z.string().optional(),
  }),

  similar: z.object({
    kicker: z.string(),
    title_html: z.string(),
    items: z.array(z.object({
      brand_display: z.string(),
      brand_slug:    z.string().nullable(),
      line_display:  z.string(),
      line_slug:     z.string().nullable(),
      color_display: z.string(),
      color_hex:     z.string().nullable(),
      redmean_distance: z.number().nullable().optional(),
      url:           z.string().nullable(),
    })),
    method_note: z.string().optional(),
    sources: z.array(sourceRef).optional(),
  }),

  pricing: z.object({
    kicker: z.string(),
    title_html: z.string(),
    cards: z.array(z.object({
      label: z.string(),
      range_display: z.string(),
      low_usd:  z.number().optional(),
      high_usd: z.number().optional(),
      note: z.string(),
    })),
    method_note: z.string().optional(),
    sources: z.array(sourceRef).optional(),
  }).partial({ method_note: true }),

  try_it: z.object({
    kicker: z.string(),
    title_html: z.string(),
    body: z.string(),
    cta_label: z.string(),
    preview_image_local_path: z.string().nullable(),
    preview_image_cdn_url:    z.string().url().nullable(),
    badge_text: z.string().optional(),
    visualizer_payload: visualizerPayload,
  }),

  faq_items: z.array(z.object({ q: z.string(), a: z.string() })),

  closing: z.object({
    kicker: z.string(),
    h2_html: z.string(),
    cta_label: z.string(),
    visualizer_payload: visualizerPayload,
  }),

  data_sources: z.array(sourceRef),
  scraped_at: z.string(),
}).passthrough();

// ---------- S4 Combination ----------
const comboS4Schema = z.object({
  slug: z.string(),
  url_path: z.string(),
  h1: z.string(),
  meta_title: z.string(),
  meta_description: z.string(),
  strategy: z.literal(4),
  house_color_slug: z.string(),
  house_color_display: z.string(),
  roof_color_slug: z.string(),
  roof_color_display: z.string(),
  house_color_hex: z.string(),
  roof_color_hex: z.string(),
  modifier: z.string().nullable(),
  target_keyword: z.string(),
  combo_hero: z.object({ }).passthrough(),
  long_gallery: z.object({ }).passthrough(),
  visualizer_cta: z.object({ }).passthrough(),
  recommended: z.object({ }).passthrough(),
  consider: z.object({ }).passthrough(),
  common_mistakes: z.object({ }).passthrough(),
  variations: z.object({ }).passthrough(),
  faq_items: z.array(z.object({ q: z.string(), a: z.string() })),
  closing: z.object({ }).passthrough(),
  data_sources: z.array(sourceRef),
  scraped_at: z.string(),
}).passthrough();

// ---------- S5 Style x Roof ----------
const comboS5Schema = z.object({
  slug: z.string(),
  url_path: z.string(),
  h1: z.string(),
  meta_title: z.string(),
  meta_description: z.string(),
  strategy: z.literal(5),
  home_style_slug: z.string(),
  home_style_display: z.string(),
  roof_color_slug: z.string(),
  roof_color_display: z.string(),
  style_hex: z.string(),
  roof_color_hex: z.string(),
  combo_hero: z.object({ }).passthrough(),
  style_background: z.object({ }).passthrough(),
  long_gallery: z.object({ }).passthrough(),
  visualizer_cta: z.object({ }).passthrough(),
  recommended: z.object({ }).passthrough(),
  consider: z.object({ }).passthrough(),
  variations: z.object({ }).passthrough(),
  faq_items: z.array(z.object({ q: z.string(), a: z.string() })),
  closing: z.object({ }).passthrough(),
  data_sources: z.array(sourceRef),
  scraped_at: z.string(),
}).passthrough();

// ---------- S6 Color Hub ----------
const colorHubSchema = z.object({
  slug: z.string(),
  url_path: z.string(),
  h1: z.string(),
  meta_title: z.string(),
  meta_description: z.string(),
  strategy: z.literal(6),
  roof_archetype_slug: z.string(),
  roof_archetype_display: z.string(),
  roof_archetype_hex: z.string(),
  hub_hero: z.object({ }).passthrough(),
  combos: z.object({ }).passthrough(),
  visualizer_cta: z.object({ }).passthrough(),
  long_gallery: z.object({ }).passthrough(),
  materials: z.object({ }).passthrough(),
  crosslinks: z.object({ }).passthrough(),
  faq_items: z.array(z.object({ q: z.string(), a: z.string() })),
  closing: z.object({ }).passthrough(),
  data_sources: z.array(sourceRef),
  scraped_at: z.string(),
}).passthrough();

// ---------- S2 Comparison (lenient pass-through for now) ----------
const comparisonSchema = z.object({
  slug: z.string(),
  url_path: z.string(),
  h1: z.string(),
}).passthrough();

export const collections = {
  skus:               defineCollection({ type: 'data', schema: skuSchema }),
  'combinations-s4':  defineCollection({ type: 'data', schema: comboS4Schema }),
  'combinations-s5':  defineCollection({ type: 'data', schema: comboS5Schema }),
  'color-hubs':       defineCollection({ type: 'data', schema: colorHubSchema }),
  'comparisons':      defineCollection({ type: 'data', schema: comparisonSchema }),
};
