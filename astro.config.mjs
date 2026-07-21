// @ts-check
import { defineConfig } from 'astro/config';

import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

const technicalCalculatorPath = '/calculadoras/tecnicos-parvulos/';

// https://astro.build/config
export default defineConfig({
  redirects: {
    '/calculadoras/tecnicos-parvulos-slep': `${technicalCalculatorPath}?regimen=slep`,
    '/calculadoras/tecnicos-parvulos-daem': `${technicalCalculatorPath}?regimen=daem`
  },
  integrations: [react()],

  vite: {
    plugins: [tailwindcss()]
  }
});
