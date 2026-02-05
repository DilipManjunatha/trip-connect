import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        navigateFallback: '/index.html',
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/[^/]+\/api\/notes($|\/.*)/,
            handler: 'NetworkFirst',
            method: 'GET',
            options: {
              networkTimeoutSeconds: 4,
              cacheName: 'api-notes',
              cacheableResponse: { statuses: [200] }
            }
          },
          {
            urlPattern: /^https?:\/\/[^/]+\/api\/groups\/[^/]+\/tickets($|\/.*)/,
            handler: 'NetworkFirst',
            method: 'GET',
            options: {
              networkTimeoutSeconds: 4,
              cacheName: 'api-tickets',
              cacheableResponse: { statuses: [200] }
            }
          },
          {
            urlPattern: /^https?:\/\/[^/]+\/uploads\/.*/,
            handler: 'CacheFirst',
            method: 'GET',
            options: {
              cacheName: 'ticket-uploads',
              cacheableResponse: { statuses: [200] }
            }
          }
        ]
      },
      manifest: {
        id: '/',
        name: 'TripConnect',
        short_name: 'TripConnect',
        theme_color: '#0ea5e9',
        background_color: '#f8fafc',
        display: 'standalone',
        start_url: '/',
        prefer_related_applications: false,
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      }
    })
  ],
  server: {
    host: '0.0.0.0', // Allow external connections (for mobile browser access)
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
})
