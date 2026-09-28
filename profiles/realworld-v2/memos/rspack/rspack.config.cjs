const path = require('node:path');
const fs = require('node:fs');
const rspack = require('@rspack/core');

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
        use: [rspack.CssExtractRspackPlugin.loader, 'css-loader', 'postcss-loader', path.resolve('tailwind-entry-loader.cjs')],
      },
      {
        test: /\.css$/,
        exclude: path.resolve('src/index.css'),
        resourceQuery: { not: [/(?:raw|inline)/] },
        use: [rspack.CssExtractRspackPlugin.loader, 'css-loader', 'postcss-loader'],
      },
      { test: /\.(?:png|jpe?g|gif|webp|svg|woff2?|ttf|eot)$/i, type: 'asset/resource' },
    ],
  },
  plugins: [
    new rspack.DefinePlugin({
      'import.meta.env.DEV': 'false',
      'import.meta.env.PROD': 'true',
      'import.meta.env.MODE': JSON.stringify('production'),
    }),
    new rspack.CssExtractRspackPlugin({ filename: 'assets/[name].[contenthash:8].css', chunkFilename: 'assets/[name].[contenthash:8].css' }),
    new rspack.HtmlRspackPlugin({
      templateContent: () => fs.readFileSync('index.html', 'utf8').replace(/\s*<script type="module" src="\/src\/main\.tsx"><\/script>/, ''),
      inject: 'body',
      scriptLoading: 'module',
    }),
  ],
  optimization: { minimize: true, splitChunks: { chunks: 'all' } },
  performance: { hints: false },
};
