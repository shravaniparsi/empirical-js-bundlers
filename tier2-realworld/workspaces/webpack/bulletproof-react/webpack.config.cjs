const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const webpack = require('webpack');
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
      { test: /\.(tsx?|jsx?)$/, exclude: /node_modules/, use: {
        loader: 'swc-loader', options: { jsc: { parser: { syntax: 'typescript', tsx: true }, transform: { react: { runtime: 'automatic' } } } } } },
      { test: /\.css$/, use: [MiniCssExtractPlugin.loader, 'css-loader', 'postcss-loader'] },
      { test: /\.svg$/i, type: 'asset/resource' },
      { test: /\.(png|jpe?g|gif|webp)$/i, type: 'asset/resource' },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({ template: './index.html' }),
    new MiniCssExtractPlugin({ filename: '[name].[contenthash:8].css' }),
    new webpack.DefinePlugin({ 'import.meta.env': JSON.stringify({ DEV: false, PROD: true, MODE: 'production' }) }),
  ],
  devtool: 'source-map',
};
