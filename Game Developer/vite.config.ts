import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

// The client lives in client/; rules/ sits beside it and is imported straight from source.
export default defineConfig({
  root: 'client',
  publicDir: 'public',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
    target: 'es2022',
    // Phaser alone is 1.38 MB of script (362 kB gzipped); warn only above that.
    chunkSizeWarningLimit: 1500,
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
  },
  preview: {
    port: 4173,
    strictPort: true,
    host: true,
  },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Zite',
        short_name: 'Zite',
        description: 'A co-op board world: roll, explore, fight together.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#1b1f2a',
        theme_color: '#1b1f2a',
        icons: [
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        // Phaser is big; let the service worker cache it.
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      },
      devOptions: {
        // Off in dev: the browser pane and hot reload stay simple. `npm run build && npm run preview` has the real thing.
        enabled: false,
      },
    }),
  ],
});
