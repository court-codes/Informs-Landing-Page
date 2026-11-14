import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { cloudflare } from '@cloudflare/vite-plugin';

// VITE_STATIC builds (GitHub Pages) are plain files with no Worker.
const staticBuild = process.env.VITE_STATIC === 'true';

export default defineConfig({
  base: process.env.BASE_PATH || '/',
  plugins: [react(), ...(staticBuild ? [] : [cloudflare()])],
});
