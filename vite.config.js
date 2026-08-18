import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // Ensures relative paths for GitHub Pages
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: './index.html',
        arjs: './arjs.html',
        webxr: './webxr.html'
      }
    }
  },
});
