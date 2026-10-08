// Production profile v1; separate from historical and correctness-pilot configs.
const CssMinimizerPlugin = require("css-minimizer-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');
const webpack = require('webpack');
const isProduction = process.env.NODE_ENV === 'production';
module.exports = {
  optimization: {
    minimize: isProduction,
    minimizer: [new TerserPlugin({ terserOptions: { ecma: 2022 } }), new CssMinimizerPlugin()],
  },
  target: ["web", "es2022"],
  mode: isProduction ? 'production' : 'development',
  entry: './src/main.tsx',
  output: { publicPath: '/', path: path.resolve(__dirname, 'dist'), filename: '[name].[contenthash:8].js', clean: true },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js'],
    alias: { '@': path.resolve(__dirname, 'src') },
  },
  module: {
    rules: [
      { test: /\.(tsx?|jsx?)$/, exclude: /node_modules/, use: {
        loader: 'swc-loader', options: { jsc: { target: "es2022", parser: { syntax: 'typescript', tsx: true }, transform: { react: { runtime: 'automatic', development: !isProduction, refresh: !isProduction } } } } } },
      { test: /\.css$/, use: [isProduction ? MiniCssExtractPlugin.loader : 'style-loader', 'css-loader', 'postcss-loader'] },
      { test: /\.svg$/i, type: 'asset/resource' },
      { test: /\.(png|jpe?g|gif|webp)$/i, type: 'asset/resource' },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ templateContent: require('fs').readFileSync('./index.html', 'utf8').replace(/<script\b[^>]*src=["']\/src\/main\.tsx["'][^>]*><\/script>/, '') }),
    isProduction && new MiniCssExtractPlugin({ filename: '[name].[contenthash:8].css' }),
    !isProduction && new ReactRefreshWebpackPlugin(),
    new webpack.DefinePlugin({ 'import.meta.env': JSON.stringify({
      DEV: !isProduction,
      PROD: isProduction,
      MODE: isProduction ? 'production' : 'development',
      VITE_APP_API_URL: process.env.VITE_APP_API_URL || '/api',
      VITE_APP_ENABLE_API_MOCKING: process.env.VITE_APP_ENABLE_API_MOCKING || 'false',
    }) }),
  ].filter(Boolean),
  devServer: {
    hot: true,
  },
  devtool: 'source-map',
};
