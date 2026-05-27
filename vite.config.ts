import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import webExtension from 'vite-plugin-web-extension';
import { fileURLToPath, URL } from 'node:url';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const manifest = JSON.parse(
  readFileSync(resolve(__dirname, 'src/manifest.json'), 'utf-8'),
);

export default defineConfig({
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '@popup': fileURLToPath(new URL('./src/popup', import.meta.url)),
    },
  },
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    webExtension({
      manifest: () => manifest,
    }),
  ],
  build: {
    target: 'esnext',
    sourcemap: true,
    outDir: 'dist',
    emptyOutDir: true,
  },
});
