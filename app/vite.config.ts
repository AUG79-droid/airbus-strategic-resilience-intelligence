import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // Preview (Vite dev server) runs at / in an isolated browser environment;
  // the production build retains the existing GitHub Pages subpath.
  base: command === 'serve' ? '/' : '/airbus-strategic-resilience-intelligence/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
}));
