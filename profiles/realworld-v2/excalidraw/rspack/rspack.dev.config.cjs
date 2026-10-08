const rspack = require('@rspack/core');
const ReactRefreshPlugin = require('@rspack/plugin-react-refresh');
const base = require('./rspack.config.cjs');
const developmentDefinitions = {
  ...require('./environment.cjs').definitions(),
  'import.meta.env.DEV': 'true',
  'import.meta.env.PROD': 'false',
  'import.meta.env.MODE': JSON.stringify('development'),
};
const rules = base.module.rules.map((rule) => {
  if (rule.test?.test('component.tsx')) return { ...rule, use: { loader: 'builtin:swc-loader', options: { jsc: { parser: { syntax: 'typescript', tsx: true }, transform: { react: { runtime: 'automatic', development: true, refresh: true } }, target: 'es2022' } } } };
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
    new rspack.DefinePlugin({ ...developmentDefinitions, 'process.env.NODE_ENV': JSON.stringify('development') }),
    new ReactRefreshPlugin(),
  ],
  optimization: { minimize: false },
  devServer: { hot: true, historyApiFallback: true, client: { overlay: { errors: true, warnings: false } } },
};
