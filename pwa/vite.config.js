import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['logo.png', 'hope.png'],
      manifest: {
        name: 'Hope Gym',
        short_name: 'Hope Gym',
        description: 'Hope Fitness Center member app',
        theme_color: '#0B0E1B',
        background_color: '#0B0E1B',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'hope.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'hope.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'hope.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
        ],
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  server: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
  preview: {
    host: true,
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
      '/uploads': {
        target: 'http://127.0.0.1:4000',
        changeOrigin: true,
      },
    },
  },
});

