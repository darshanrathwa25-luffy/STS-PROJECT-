import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  // Relative asset paths, so the built site works from any folder,
  // e.g. GitHub Pages' https://<user>.github.io/<repo>/ (routes live after the #)
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    allowedHosts: [
      'grouped-brick-affair.ngrok-free.dev',
    ],
  },
});