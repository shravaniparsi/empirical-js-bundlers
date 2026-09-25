const path = require('path');
const rspack = require('@rspack/core');
const ReactRefreshPlugin = require('@rspack/plugin-react-refresh');

const isProduction = process.env.NODE_ENV === 'production';
module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: './src/main.tsx',
  output: { publicPath: '/', path: path.resolve(__dirname, 'dist'), filename: '[name].[contenthash:8].js', clean: true },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  module: {
    rules: [
      { test: /\.(tsx?|jsx?)$/, exclude: /node_modules/, loader: 'builtin:swc-loader',
        options: { jsc: { parser: { syntax: 'typescript', tsx: true }, transform: { react: { runtime: 'automatic', development: !isProduction, refresh: !isProduction } } } } },
      { test: /\.css$/, type: 'javascript/auto', use: [
        isProduction ? rspack.CssExtractRspackPlugin.loader : 'style-loader',
        'css-loader',
        'postcss-loader'
      ]},
      { test: /\.svg$/i, type: 'asset/resource' },
      { test: /\.(png|jpe?g|gif|webp)$/i, type: 'asset/resource' },
    ],
  },
  plugins: [
    isProduction && new rspack.CssExtractRspackPlugin(),
    new rspack.HtmlRspackPlugin({ templateContent: require('fs').readFileSync('./index.html', 'utf8').replace(/<script\b[^>]*src=["']\/src\/main\.tsx["'][^>]*><\/script>/, '') }),
    new rspack.DefinePlugin({ 'import.meta.env': JSON.stringify({
      DEV: !isProduction,
      PROD: isProduction,
      MODE: isProduction ? 'production' : 'development',
      VITE_APP_API_URL: process.env.VITE_APP_API_URL || '/api',
      VITE_APP_ENABLE_API_MOCKING: process.env.VITE_APP_ENABLE_API_MOCKING || 'false',
    }) }),
    !isProduction && new ReactRefreshPlugin(),
  ].filter(Boolean),
  devServer: {
    port: 5299,
    hot: true,
  },
  devtool: 'source-map',
};
