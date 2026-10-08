import { createRequire } from 'node:module';
import react from '@vitejs/plugin-react';
import { createServer } from 'vite';
const require = createRequire(import.meta.url);
const { orderedAliases } = require('./aliases.cjs');
const { definitions } = require('./environment.cjs');
const developmentDefinitions = {
  ...definitions(),
  'import.meta.env.DEV': 'true',
  'import.meta.env.PROD': 'false',
  'import.meta.env.MODE': JSON.stringify('development'),
};
const args = process.argv.slice(2);
const value = (name, fallback) => {
  const index = args.indexOf(name);
  return index === -1 ? fallback : args[index + 1];
};
const server = await createServer({
  configFile: false,
  root: process.cwd(),
  publicDir: 'public',
  define: developmentDefinitions,
  resolve: { alias: orderedAliases() },
  plugins: [
    { name: 'benchmark-index', configureServer(server) { server.middlewares.use((request, _response, next) => { if (request.url === '/') request.url = '/benchmark-index.html'; next(); }); } },
    react(),
  ],
  server: { host: value('--host', '127.0.0.1'), port: Number(value('--port', '3000')), strictPort: true },
});
await server.listen();
server.printUrls();
