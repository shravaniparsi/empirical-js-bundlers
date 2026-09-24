const path = require('path');
const { HtmlRspackPlugin } = require('@rspack/core');
const ReactRefreshPlugin = require('@rspack/plugin-react-refresh');

const isProduction = process.env.NODE_ENV === 'production';

/** @type {import('@rspack/cli').Configuration} */
module.exports = {
  mode: isProduction ? 'production' : 'development',
  entry: './src/main.tsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: isProduction ? '[name].[contenthash].js' : '[name].js',
    cssFilename: isProduction ? '[name].[contenthash].css' : '[name].css',
    clean: true,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
  },
  devServer: {
    port: 3000,
    hot: true,
  },
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        use: {
          loader: 'builtin:swc-loader',
          options: {
            jsc: {
              parser: { syntax: 'typescript', tsx: true },
              transform: {
                react: {
                  runtime: 'automatic',
                  development: !isProduction,
                  refresh: !isProduction,
                },
              },
            },
          },
        },
      },
      {
        test: /\.module\.css$/,
        use: [
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: isProduction
                  ? '[hash:base64:8]'
                  : '[name]__[local]--[hash:base64:5]',
              },
            },
          },
        ],
        type: 'javascript/auto',
      },
      {
        test: /\.css$/,
        exclude: /\.module\.css$/,
        type: 'css',
      },
      {
        test: /\.(png|jpg|gif|svg)$/,
        type: 'asset/resource',
      },
    ],
  },
  plugins: [
    new HtmlRspackPlugin({
      template: './index.html',
    }),
    !isProduction && new ReactRefreshPlugin(),
  ].filter(Boolean),
};
