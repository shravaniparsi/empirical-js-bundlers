const path = require('path');
const rspack = require('@rspack/core');
module.exports = {
  mode: 'production',
  entry: './src/main.tsx',
  output: { path: path.resolve(__dirname, 'dist'), filename: '[name].[contenthash:8].js', clean: true },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  module: {
    rules: [
      { test: /\.(tsx?|jsx?)$/, exclude: /node_modules/, loader: 'builtin:swc-loader',
        options: { jsc: { parser: { syntax: 'typescript', tsx: true }, transform: { react: { runtime: 'automatic' } } } } },
      { test: /\.css$/, type: 'javascript/auto', use: [
        rspack.CssExtractRspackPlugin.loader,
        'css-loader',
        'postcss-loader'
      ]},
      { test: /\.svg$/i, type: 'asset/resource' },
      { test: /\.(png|jpe?g|gif|webp)$/i, type: 'asset/resource' },
    ],
  },
  plugins: [
    new rspack.CssExtractRspackPlugin(),
    new rspack.HtmlRspackPlugin({ template: './index.html' }),
    new rspack.DefinePlugin({ 'import.meta.env': JSON.stringify({ DEV: false, PROD: true, MODE: 'production' }) }),
  ],
  devtool: 'source-map',
};
