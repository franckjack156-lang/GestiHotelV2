import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
      manifest: {
        name: 'GestiHôtel - Gestion Hôtelière',
        short_name: 'GestiHôtel',
        description:
          'Application de gestion des interventions, maintenance et services hôteliers. Suivi en temps réel, planning, messagerie et reporting.',
        theme_color: '#4f46e5',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        categories: ['productivity', 'business', 'utilities'],
        lang: 'fr-FR',
        dir: 'ltr',
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        screenshots: [
          {
            src: 'screenshots/dashboard.png',
            sizes: '1280x720',
            type: 'image/png',
            label: 'Dashboard principal',
          },
          {
            src: 'screenshots/interventions.png',
            sizes: '1280x720',
            type: 'image/png',
            label: 'Gestion des interventions',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Stratégies de mise en cache améliorées
        runtimeCaching: [
          // API Firestore - Réseau en premier, cache en secours
          {
            urlPattern: /^https:\/\/firestore\.googleapis\.com\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'firestore-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 24 heures
              },
              networkTimeoutSeconds: 10, // Timeout de 10s avant fallback
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Firebase Storage - Cache en premier pour les fichiers
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-storage-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 jours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Images - Cache en premier
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 jours
              }
            }
          },
          // Fonts - Cache en premier
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 an
              }
            }
          }
        ],
        // Nettoyage automatique des anciens caches
        cleanupOutdatedCaches: true,
        // Activer le skip waiting pour mise à jour immédiate
        skipWaiting: true,
        clientsClaim: true
      },
      // Support du Background Sync
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@/types': path.resolve(__dirname, './src/types')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // React core
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          // React Router
          if (id.includes('node_modules/react-router')) {
            return 'vendor-router';
          }
          // Firebase
          if (id.includes('node_modules/firebase/') || id.includes('node_modules/@firebase/')) {
            return 'vendor-firebase';
          }
          // Radix UI
          if (id.includes('node_modules/@radix-ui/')) {
            return 'vendor-radix';
          }
          // Formulaires
          if (id.includes('node_modules/react-hook-form') ||
              id.includes('node_modules/@hookform') ||
              id.includes('node_modules/zod')) {
            return 'vendor-form';
          }
          // Utilitaires date
          if (id.includes('node_modules/date-fns')) {
            return 'vendor-date';
          }
          // Utilitaires CSS
          if (id.includes('node_modules/clsx') || id.includes('node_modules/tailwind-merge')) {
            return 'vendor-css-utils';
          }
          // DnD Kit
          if (id.includes('node_modules/@dnd-kit')) {
            return 'vendor-dnd';
          }
          // Framer Motion
          if (id.includes('node_modules/framer-motion')) {
            return 'vendor-animation';
          }
          // Lucide Icons - Chunk séparé pour bénéficier du tree-shaking
          // Important: ne pas bundler avec d'autres dépendances
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-icons';
          }
          // Autres node_modules
          if (id.includes('node_modules/')) {
            return 'vendor-other';
          }
        },
      },
    },
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Retirer les console.log en production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn'], // Fonctions à retirer
      },
      mangle: {
        keep_classnames: true,
        keep_fnames: true,
      },
    },
    // Optimisations supplémentaires
    chunkSizeWarningLimit: 1000, // Avertir si chunk > 1MB
    cssCodeSplit: true, // Split CSS par route
  },
  server: {
    port: 5173,
    open: true
  }
});