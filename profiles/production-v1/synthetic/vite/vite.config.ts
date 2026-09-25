// Production profile v1; separate from historical and correctness-pilot configs.
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    target: "es2022",
    minify: "oxc",
    cssMinify: "lightningcss",
    cssTarget: "chrome107",
    assetsInlineLimit: 0,
    outDir: 'dist',
    sourcemap: true,
  },
});
