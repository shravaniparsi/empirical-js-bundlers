// Production profile v1; separate from historical and correctness-pilot configs.
const { SwcJsMinimizerRspackPlugin, LightningCssMinimizerRspackPlugin } = require("@rspack/core");
const path = require('path');
const { HtmlRspackPlugin } = require('@rspack/core');
const ReactRefreshPlugin = require('@rspack/plugin-react-refresh');

const isProduction = process.env.NODE_ENV === 'production';

/** @type {import('@rspack/cli').Configuration} */
module.exports = {
  optimization: {
    minimize: isProduction,
    minimizer: [new SwcJsMinimizerRspackPlugin({ minimizerOptions: { ecma: 2022 } }), new LightningCssMinimizerRspackPlugin({ minimizerOptions: { targets: "chrome >= 107" } })],
  },
  target: ["web", "es2022"],
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
            jsc: { target: "es2022",
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
        type: 'css/module',
        parser: { namedExports: false },
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
      templateContent: require('fs').readFileSync('./index.html', 'utf8').replace(/<script\b[^>]*src=["']\/src\/main\.tsx["'][^>]*><\/script>/, ''),
    }),
    !isProduction && new ReactRefreshPlugin(),
  ].filter(Boolean),
};
