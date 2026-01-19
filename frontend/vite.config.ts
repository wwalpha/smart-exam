import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import type { PluginOption } from 'vite';
import { fileURLToPath, URL } from 'node:url';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), (tailwindcss as unknown as () => PluginOption)()],
  server: {
    host: true,
    port: 5173,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
      '@typings': fileURLToPath(new URL('./typings', import.meta.url)),
    },
  },
  build: {
    // The default (500kB) is too chatty for this app; raise the warning threshold.
    chunkSizeWarningLimit: 900,
  },
});
