const fs = require('node:fs');
const path = require('node:path');
const rspack = require('@rspack/core');
const { webpackAliases } = require('./aliases.cjs');
const { definitions } = require('./environment.cjs');

module.exports = {
  mode: 'production',
  context: process.cwd(),
  entry: './excalidraw-app/index.tsx',
  target: ['web', 'es2022'],
  devtool: 'source-map',
  output: {
    path: path.resolve('dist'),
    filename: 'assets/[name].[contenthash:8].js',
    chunkFilename: 'assets/[name].[contenthash:8].js',
    assetModuleFilename: 'assets/[name].[contenthash:8][ext]',
    publicPath: '/',
    clean: true,
  },
  resolve: { extensions: ['.tsx', '.ts', '.mts', '.jsx', '.js', '.mjs', '.json'], alias: webpackAliases() },
  module: { rules: [
    { test: /\.[cm]?[jt]sx?$/, exclude: /node_modules/, use: { loader: 'builtin:swc-loader', options: { jsc: { parser: { syntax: 'typescript', tsx: true }, transform: { react: { runtime: 'automatic' } }, target: 'es2022' } } } },
    { test: /\.s?css$/i, use: [rspack.CssExtractRspackPlugin.loader, 'css-loader', 'sass-loader'] },
    { test: /\.(?:png|jpe?g|gif|webp|svg|woff2?|ttf|eot|excalidrawlib)$/i, type: 'asset/resource' },
  ] },
  plugins: [
    new rspack.DefinePlugin({ ...definitions(), 'process.env.NODE_ENV': JSON.stringify('production') }),
    new rspack.CssExtractRspackPlugin({ filename: 'assets/[name].[contenthash:8].css', chunkFilename: 'assets/[name].[contenthash:8].css' }),
    new rspack.HtmlRspackPlugin({
      templateContent: () => fs.readFileSync('benchmark-index.html', 'utf8').replace(/\s*<script type="module" src="\/excalidraw-app\/index\.tsx"><\/script>/, ''),
      inject: 'body',
      scriptLoading: 'module',
    }),
  ],
  optimization: { minimize: true, splitChunks: { chunks: 'all' } },
  performance: { hints: false },
};
