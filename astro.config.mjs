// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

const isGitHubPages = process.env.DEPLOY_TARGET === 'github-pages';
const technicalCalculatorPath = `${isGitHubPages ? '/sueldos-publicos' : ''}/calculadoras/tecnicos-parvulos/`;

// https://astro.build/config
export default defineConfig({
  site: isGitHubPages ? 'https://reyesvaldeslabs.github.io' : undefined,
  base: isGitHubPages ? '/sueldos-publicos' : '/',
  redirects: {
    '/calculadoras/tecnicos-parvulos-slep': `${technicalCalculatorPath}?regimen=slep`,
    '/calculadoras/tecnicos-parvulos-daem': `${technicalCalculatorPath}?regimen=daem`
  },
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  }
});
