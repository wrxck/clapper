import { fileURLToPath } from 'node:url';

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// the ui lives in ui/ but imports the film + schema from ../src and serves the
// project's public/ folder (screenshots, logo) so the live preview matches a
// real render. root is ui/ so index.html resolves here.
const here = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: here,
  publicDir: fileURLToPath(new URL('../public', import.meta.url)),
  plugins: [react()],
  server: { port: 5173, open: true },
  build: { outDir: fileURLToPath(new URL('./dist', import.meta.url)), emptyOutDir: true },
});
