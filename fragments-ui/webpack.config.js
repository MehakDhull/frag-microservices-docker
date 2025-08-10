const HtmlWebpackPlugin = require('html-webpack-plugin');
const { GenerateSW } = require('workbox-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const webpack = require('webpack');
const path = require('path');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';
  
  return {
    entry: './src/index.js',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'bundle.js',
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: {
            loader: 'babel-loader',
            options: {
              presets: ['@babel/preset-env'],
            },
          },
        },
        {
          test: /\.css$/i,
          use: ['style-loader', 'css-loader'],
        },
      ],
    },
    plugins: [
      new webpack.DefinePlugin({
        'process.env': {
          REACT_APP_API_URL: JSON.stringify(process.env.REACT_APP_API_URL || 'http://localhost:8080'),
        },
      }),
      new HtmlWebpackPlugin({
        template: './src/index.html',
        title: 'Fragments UI',
      }),
      new CopyWebpackPlugin({
        patterns: [
          { from: './src/manifest.json', to: 'manifest.json' },
          { from: './src/service-worker.js', to: 'service-worker.js' },
        ],
      }),
      ...(isProduction ? [
        new GenerateSW({
          clientsClaim: true,
          skipWaiting: true,
        }),
      ] : []),
    ],
    devServer: {
      static: './dist',
      port: 3000,
      open: true,
      hot: true,
    },
  };
};
