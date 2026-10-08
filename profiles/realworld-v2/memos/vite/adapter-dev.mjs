import path from 'node:path';
import postcss from 'postcss';
import react from '@vitejs/plugin-react';
import { createServer } from 'vite';
import postcssConfig from './postcss.config.cjs';

const args = process.argv.slice(2);
const value = (name, fallback) => {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
};
const backend = process.env.MEMOS_BACKEND_ORIGIN;
if (!backend) throw new Error('MEMOS_BACKEND_ORIGIN is required');
const filename = path.resolve('src/index.css');
const server = await createServer({
  configFile: false,
  root: process.cwd(),
  publicDir: 'public',
  define: {
    'import.meta.env.DEV': 'true',
    'import.meta.env.PROD': 'false',
    'import.meta.env.MODE': JSON.stringify('development'),
  },
  resolve: { alias: { '@': path.resolve('src') } },
  css: { postcss: postcssConfig, transformer: 'lightningcss' },
  plugins: [
    {
      name: 'memos-tailwind-entry',
      enforce: 'pre',
      async transform(code, id) {
        if (id.split('?')[0] !== filename) return null;
        const result = await postcss(postcssConfig.plugins).process(code, { from: filename, map: false });
        return { code: result.css, map: null };
      },
    },
    react({ babel: { plugins: [['babel-plugin-react-compiler', {}]] } }),
  ],
  server: {
    host: value('--host', '127.0.0.1'),
    port: Number(value('--port', '3000')),
    strictPort: true,
    proxy: {
      '/api': backend,
      '/memos.api': backend,
      '/file': backend,
    },
  },
});
await server.listen();
server.printUrls();
