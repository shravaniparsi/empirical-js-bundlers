const path = require('node:path');
const fs = require('node:fs');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');

module.exports = {
  mode: 'production',
  context: process.cwd(),
  entry: './src/main.tsx',
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
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: { '@': path.resolve('src') },
  },
  module: {
    rules: [
      { test: /\.[cm]?[jt]sx?$/, include: path.resolve('src'), use: 'babel-loader' },
      { test: /\.css$/, resourceQuery: /(?:raw|inline)/, type: 'asset/source' },
      { test: /maplibre-gl-worker\.mjs$/, resourceQuery: /worker/, type: 'asset/resource', generator: { filename: 'assets/[name].[contenthash:8][ext]' } },
      {
        test: /index\.css$/,
        include: path.resolve('src'),
        resourceQuery: { not: [/(?:raw|inline)/] },
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader', path.resolve('tailwind-entry-loader.cjs')],
      },
      {
        test: /\.css$/,
        exclude: path.resolve('src/index.css'),
        resourceQuery: { not: [/(?:raw|inline)/] },
        use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'],
      },
      { test: /\.(?:png|jpe?g|gif|webp|svg|woff2?|ttf|eot)$/i, type: 'asset/resource' },
    ],
  },
  plugins: [
    new webpack.DefinePlugin({
      'import.meta.env.DEV': 'false',
      'import.meta.env.PROD': 'true',
      'import.meta.env.MODE': JSON.stringify('production'),
    }),
    new MiniCssExtractPlugin({ filename: 'assets/[name].[contenthash:8].css', chunkFilename: 'assets/[name].[contenthash:8].css' }),
    new HtmlWebpackPlugin({
      templateContent: () => fs.readFileSync('index.html', 'utf8').replace(/\s*<script type="module" src="\/src\/main\.tsx"><\/script>/, ''),
      inject: 'body',
      scriptLoading: 'module',
    }),
  ],
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin({ extractComments: false }), new CssMinimizerPlugin()],
    splitChunks: { chunks: 'all' },
  },
  performance: { hints: false },
};
