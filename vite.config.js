import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import UnoCSS from 'unocss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
// --- Capacitor Integration: Ensure correct base path and output for native builds ---
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: './', // Required for Capacitor: relative asset paths
    build: {
      outDir: 'dist', // Capacitor expects web assets in 'dist'
    },
    server: {
      host: true, // Allow LAN/devices to access dev server
    },
    plugins: [
      react(), 
      UnoCSS(),
      VitePWA({
        registerType: 'autoUpdate',
        devOptions: {
          enabled: true
        },
        // Service Worker configuration
        workbox: {
          // Allow larger files to be precached (for big JS bundles)
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024, // 4MB
          // Handle SPA navigation (serves index.html for all routes)
          navigateFallback: '/index.html',
          
          // Rules for runtime caching
          runtimeCaching: [
            {
              // Always fetch /api/health from the network (never cache)
              urlPattern: /\/api\/health$/,
              handler: 'NetworkOnly',
              options: {
                cacheName: 'health-check',
              }
            },
            {
              // Cache API calls to your backend
              urlPattern: ({ url }) => url.origin === env.VITE_API_URL,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'api-cache',
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 // 1 day
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // Cache Google Fonts stylesheets
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            {
              // Cache Google Fonts webfont files
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        },

        // PWA Manifest options
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'Morres Logistics',
          short_name: 'Morres',
          description: 'Morres Logistics Tracking',
          theme_color: '#ffffff',
          icons: [
            {
              src: 'logo.jpg',
              sizes: '192x192',
              type: 'image/jpeg'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png'
            }
          ]
        }
      })
    ],
  }
})
