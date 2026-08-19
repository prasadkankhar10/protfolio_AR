import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import fs from 'fs';

export default defineConfig({
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  server: {
    host: true,
    https: fs.existsSync('./certs/key.pem') ? {
      key: fs.readFileSync('./certs/key.pem'),
      cert: fs.readFileSync('./certs/cert.pem')
    } : false
  },
  base: './', // Ensures relative paths for GitHub Pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './index.html',
        arjs: './arjs.html',
        webxr: './webxr.html',
        eighthwall: './8thwall.html',
        rpg: './rpg.html'
      }
    }
  }
});
