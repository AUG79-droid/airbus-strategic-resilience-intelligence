import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/airbus-strategic-resilience-intelligence/',
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
});
