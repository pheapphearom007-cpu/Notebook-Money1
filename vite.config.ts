import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import { cloudApiPlugin } from './scripts/serverApiPlugin.js';

export default defineConfig({
  plugins: [
    cloudApiPlugin(),
    react(),
    tailwindcss(),
    viteSingleFile(),
  ],
  server: {
    host: true, // Allows other devices (e.g. mobile phones on same Wi-Fi) to connect
  },
  base: './',
});
