import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import vuetify from 'vite-plugin-vuetify';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath, URL } from 'node:url';

export default defineConfig({
  base: '/eyesaver/',
  resolve: {
    alias: {
      '@shared': fileURLToPath(new URL('./src/shared', import.meta.url)),
      '@pwa': fileURLToPath(new URL('./src/pwa', import.meta.url)),
      '@popup': fileURLToPath(new URL('./src/popup', import.meta.url)),
    },
  },
  plugins: [
    vue(),
    vuetify({ autoImport: true }),
    VitePWA({
      strategies: 'injectManifest',
      srcDir: '.',
      filename: 'service-worker.ts',
      registerType: 'prompt',
      injectRegister: false,
      manifest: {
        name: 'EyeSaver',
        short_name: 'EyeSaver',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#00897B',
        start_url: '/eyesaver/',
        scope: '/eyesaver/',
        icons: [
          {
            src: '/eyesaver/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/eyesaver/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  root: 'src/pwa',
  publicDir: '../../public',
  build: {
    target: 'esnext',
    sourcemap: true,
    outDir: '../../dist-pwa',
    emptyOutDir: true,
  },
});
