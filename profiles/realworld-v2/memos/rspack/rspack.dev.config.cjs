const rspack = require('@rspack/core');
const ReactRefreshPlugin = require('@rspack/plugin-react-refresh');
const base = require('./rspack.config.cjs');
const babel = require('./babel.config.cjs');
const backend = process.env.MEMOS_BACKEND_ORIGIN;
if (!backend) throw new Error('MEMOS_BACKEND_ORIGIN is required');
const rules = base.module.rules.map((rule) => {
  if (rule.test?.test('component.tsx')) return { ...rule, use: { loader: 'babel-loader', options: { ...babel, plugins: [...babel.plugins, require.resolve('react-refresh/babel')] } } };
  if (!Array.isArray(rule.use)) return rule;
  return { ...rule, use: rule.use.map((loader, index) => index === 0 ? 'style-loader' : loader) };
});
module.exports = {
  ...base,
  mode: 'development',
  devtool: 'eval-cheap-module-source-map',
  output: { ...base.output, filename: 'assets/[name].js', chunkFilename: 'assets/[name].js', clean: true },
  module: { ...base.module, rules },
  plugins: [
    ...base.plugins.filter((plugin) => !['DefinePlugin', 'CssExtractRspackPlugin'].includes(plugin.constructor.name)),
    new rspack.DefinePlugin({ 'import.meta.env.DEV': 'true', 'import.meta.env.PROD': 'false', 'import.meta.env.MODE': JSON.stringify('development') }),
    new ReactRefreshPlugin(),
  ],
  optimization: { minimize: false },
  devServer: { hot: true, historyApiFallback: true, client: { overlay: { errors: true, warnings: false } }, proxy: [{ context: ['/api', '/memos.api', '/file'], target: backend }] },
};
