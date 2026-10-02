const fs = require('node:fs');
const path = require('node:path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
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
    { test: /\.[cm]?[jt]sx?$/, exclude: /node_modules/, use: { loader: 'babel-loader', options: require('./babel.config.cjs') } },
    { test: /\.s?css$/i, use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'] },
    { test: /\.(?:png|jpe?g|gif|webp|svg|woff2?|ttf|eot|excalidrawlib)$/i, type: 'asset/resource' },
  ] },
  plugins: [
    new webpack.DefinePlugin({ ...definitions(), 'process.env.NODE_ENV': JSON.stringify('production') }),
    new MiniCssExtractPlugin({ filename: 'assets/[name].[contenthash:8].css', chunkFilename: 'assets/[name].[contenthash:8].css' }),
    new HtmlWebpackPlugin({
      templateContent: () => fs.readFileSync('benchmark-index.html', 'utf8').replace(/\s*<script type="module" src="\/excalidraw-app\/index\.tsx"><\/script>/, ''),
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
