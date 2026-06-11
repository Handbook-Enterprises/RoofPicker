import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import react from '@astrojs/react';

// https://docs.astro.build/en/reference/configuration-reference/
export default defineConfig({
  site: process.env.PUBLIC_SITE_URL || 'https://getroofreport.com',
  output: 'static',
  trailingSlash: 'always',
  compressHTML: true,
  build: {
    assets: 'assets',
    inlineStylesheets: 'auto',
  },
  integrations: [
    sitemap({
      filter: (page) => !page.includes('/preview/') && !page.includes('/404'),
      changefreq: 'weekly',
      priority: 0.7,
    }),
    react(),
  ],
  vite: {
    build: {
      cssCodeSplit: true,
    },
  },
  // Security headers are emitted via public/_headers (Cloudflare Pages
  // honors that file for every response). Keeping them out of the runtime
  // means the static build stays adapter-free.
});
