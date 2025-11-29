import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Optimisation des images
    ViteImageOptimizer({
      png: {
        quality: 80,
      },
      jpeg: {
        quality: 80,
      },
      jpg: {
        quality: 80,
      },
      webp: {
        quality: 80,
      },
      svg: {
        multipass: true,
        plugins: [
          {
            name: 'preset-default',
            params: {
              overrides: {
                cleanupNumericValues: false,
                removeViewBox: false,
              },
            },
          },
        ],
      },
    }),
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
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,webp}'],
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
                maxAgeSeconds: 60 * 60 * 24, // 24 heures
              },
              networkTimeoutSeconds: 10, // Timeout de 10s avant fallback
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Firebase Storage - Cache en premier pour les fichiers
          {
            urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'firebase-storage-cache',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 jours
              },
              cacheableResponse: {
                statuses: [0, 200],
              },
            },
          },
          // Images - Cache en premier
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 jours
              },
            },
          },
          // Fonts - Cache en premier
          {
            urlPattern: /\.(?:woff|woff2|ttf|eot)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'fonts-cache',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 * 365, // 1 an
              },
            },
          },
        ],
        // Nettoyage automatique des anciens caches
        cleanupOutdatedCaches: true,
        // Augmenter la limite pour les gros fichiers (stats.html)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB
        // Activer le skip waiting pour mise à jour immédiate
        skipWaiting: true,
        clientsClaim: true,
      },
      // Support du Background Sync
      devOptions: {
        enabled: false, // Désactivé en dev pour éviter les problèmes de cache
        type: 'module',
      },
    }),
    // Analyseur de bundle (généré uniquement en build)
    visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // 'sunburst', 'treemap', 'network'
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/features': path.resolve(__dirname, './src/features'),
      '@/shared': path.resolve(__dirname, './src/shared'),
      '@/core': path.resolve(__dirname, './src/core'),
      '@/types': path.resolve(__dirname, './src/types'),
    },
  },
  build: {
    target: 'esnext',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info', 'console.debug'],
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: {
          // React core + runtime
          'vendor-react': ['react', 'react-dom', 'react/jsx-runtime'],
          // Router
          'vendor-router': ['react-router-dom'],
          // Firebase - séparé pour permettre lazy loading
          'vendor-firebase': [
            'firebase/app',
            'firebase/auth',
            'firebase/firestore',
            'firebase/storage',
            'firebase/messaging',
          ],
          // Formulaires
          'vendor-form': ['react-hook-form', '@hookform/resolvers', 'zod'],
          // Dates
          'vendor-date': ['date-fns'],
          // UI Libraries - regroupées car souvent utilisées ensemble
          'vendor-ui': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-popover',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-accordion',
            '@radix-ui/react-avatar',
            '@radix-ui/react-checkbox',
            '@radix-ui/react-label',
            '@radix-ui/react-progress',
            '@radix-ui/react-radio-group',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-switch',
          ],
          // DnD
          'vendor-dnd': ['@dnd-kit/core', '@dnd-kit/sortable', '@dnd-kit/utilities'],
          // Icons
          'vendor-icons': ['lucide-react'],
          // Charts (lazy loadable)
          'vendor-charts': ['recharts'],
          // Calendar (lazy loadable)
          'vendor-calendar': ['react-big-calendar', 'react-day-picker'],
          // État global
          'vendor-state': ['zustand', 'dexie', 'dexie-react-hooks'],
          // i18n
          'vendor-i18n': ['i18next', 'react-i18next', 'i18next-browser-languagedetector'],
          // Utilitaires
          'vendor-utils': [
            'class-variance-authority',
            'clsx',
            'tailwind-merge',
            'framer-motion',
            'sonner',
          ],
          // PDF/Excel (lazy loadable)
          'vendor-export': ['jspdf', 'jspdf-autotable', 'xlsx'],
          // QR/Barcode (lazy loadable)
          'vendor-qr': ['qrcode', '@zxing/library', 'otplib'],
        },
        // Noms de fichiers avec hash pour cache-busting
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },
    sourcemap: false,
    // Optimisations supplémentaires
    chunkSizeWarningLimit: 800, // Avertir si chunk > 800KB
    cssCodeSplit: true, // Split CSS par route
    reportCompressedSize: true, // Afficher la taille compressée
    // Optimisation des assets
    assetsInlineLimit: 4096, // Inline des assets < 4KB en base64
  },
  server: {
    port: 5173,
    open: true,
  },
  // Optimisations supplémentaires
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      'firebase/app',
      'firebase/auth',
      'firebase/firestore',
    ],
    exclude: ['@vite-pwa/assets-generator'],
  },
});
