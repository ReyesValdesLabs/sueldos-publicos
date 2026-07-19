// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

const isGitHubPages = process.env.DEPLOY_TARGET === 'github-pages';

// https://astro.build/config
export default defineConfig({
  site: isGitHubPages ? 'https://reyesvaldeslabs.github.io' : undefined,
  base: isGitHubPages ? '/sueldos-publicos' : '/',
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  }
});
