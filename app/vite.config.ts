import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { env } from 'node:process';

export default defineConfig({
  plugins: [react()],
  // Isolated browser previews use ASRI_ISOLATED_PREVIEW=1 and run at /;
  // the production build retains the existing GitHub Pages subpath.
  base: env.ASRI_ISOLATED_PREVIEW === '1' ? '/' : '/airbus-strategic-resilience-intelligence/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
