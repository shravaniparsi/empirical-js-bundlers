import path from 'node:path';
import { build } from 'vite';
import postcss from 'postcss';
import { transformApplication } from './transform.mjs';
import postcssConfig from './postcss.config.cjs';

const applicationPattern = /[/\\]src[/\\].*\.[cm]?[jt]sx?$/;
const watchMode = process.argv.includes('--watch');
await build({
  configFile: false,
  root: process.cwd(),
  publicDir: 'public',
  define: { 'import.meta.env.DEV': 'false', 'import.meta.env.PROD': 'true', 'import.meta.env.MODE': JSON.stringify('production') },
  resolve: { alias: { '@': path.resolve('src') } },
  css: { postcss: postcssConfig, transformer: 'lightningcss' },
  plugins: [{
    name: 'memos-common-babel-transform',
    enforce: 'pre',
    async transform(code, id) {
      const filename = id.split('?')[0];
      if (applicationPattern.test(filename)) return transformApplication(code, filename);
      if (filename === path.resolve('src/index.css')) {
        const result = await postcss(postcssConfig.plugins).process(code, { from: filename, map: false });
        return { code: result.css, map: null };
      }
      return null;
    },
  }],
  build: {
    target: 'chrome107',
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    minify: 'oxc',
    cssMinify: 'lightningcss',
    assetsInlineLimit: 0,
    ...(watchMode ? { watch: {} } : {}),
  },
});
