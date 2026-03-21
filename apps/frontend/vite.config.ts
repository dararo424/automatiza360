import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [react() as any, VitePWA({
    registerType: 'autoUpdate',
    manifest: {
      name: 'Automatiza360',
      short_name: 'A360',
      description: 'Automatización inteligente para tu negocio',
      theme_color: '#22C55E',
      background_color: '#0F172A',
      display: 'standalone',
      start_url: '/',
      scope: '/',
      icons: [
        { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
      ],
    },
    workbox: {
      globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  }) as any],
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});
