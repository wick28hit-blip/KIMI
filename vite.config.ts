import path from 'path';
import { fileURLToPath } from 'url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, __dirname, '');
    return {
      base: './', 
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [
        react(),
        VitePWA({
          strategies: 'injectManifest',
          srcDir: '.',
          filename: 'service-worker.ts',
          registerType: 'autoUpdate',
          includeAssets: ['kimi_192.svg', 'kimi_512.svg'],
          manifest: {
            name: 'KIMI - Period Tracker',
            short_name: 'KIMI',
            description: 'Privacy-first, encrypted period tracker with AI insights.',
            theme_color: '#FFF0F3',
            background_color: '#FFF0F3',
            display: 'standalone',
            orientation: 'portrait',
            scope: './', 
            start_url: './', 
            icons: [
              {
                src: 'kimi_192.svg',
                sizes: '192x192',
                type: 'image/svg+xml'
              },
              {
                src: 'kimi_512.svg',
                sizes: '512x512',
                type: 'image/svg+xml'
              },
              {
                src: 'kimi_512.svg',
                sizes: '512x512',
                type: 'image/svg+xml',
                purpose: 'any maskable'
              }
            ]
          },
          devOptions: {
            enabled: true,
            type: 'module',
          }
        })
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY || ''),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});