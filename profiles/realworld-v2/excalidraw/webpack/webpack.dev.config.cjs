const webpack = require('webpack');
const ReactRefreshPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const base = require('./webpack.config.cjs');
const babel = require('./babel.config.cjs');
const developmentDefinitions = {
  ...require('./environment.cjs').definitions(),
  'import.meta.env.DEV': 'true',
  'import.meta.env.PROD': 'false',
  'import.meta.env.MODE': JSON.stringify('development'),
};
const rules = base.module.rules.map((rule) => {
  if (rule.test?.test('component.tsx')) return { ...rule, use: { loader: 'babel-loader', options: { ...babel, plugins: [...(babel.plugins || []), require.resolve('react-refresh/babel')] } } };
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
    ...base.plugins.filter((plugin) => !['DefinePlugin', 'MiniCssExtractPlugin'].includes(plugin.constructor.name)),
    new webpack.DefinePlugin({ ...developmentDefinitions, 'process.env.NODE_ENV': JSON.stringify('development') }),
    new ReactRefreshPlugin(),
  ],
  optimization: { minimize: false },
  devServer: { hot: true, historyApiFallback: true, client: { overlay: { errors: true, warnings: false } } },
};
