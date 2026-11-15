import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/snowdash20/' : '/',
  build: {
    target: 'esnext',
    assetsInlineLimit: 0,
  },
});
