var webpack = require('webpack');
var path = require('path');
var NodeTargetPlugin = require('webpack/lib/node/NodeTargetPlugin');
var HtmlWebpackPlugin = require('html-webpack-plugin');
var WebpackErrorNotificationPlugin = require('webpack-error-notification');

module.exports = {
  entry: [
    path.resolve(__dirname, 'app/entry.js'),
    'bootstrap-loader'
  ],
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'bundle.js'
  },
  devtool: 'cheap-module-eval-source-map',
  module: {
    loaders: [
      {
        test: /\.(js|jsx)$/,
        loaders: ['babel-loader'],
        exclude: /node_modules/
      },
      {
        test: /\.scss$/,
        loader: "style!css!sass",
        exclude: /node_modules/
      },
      {
        test: /\.(woff2?|svg)$/,
        loader: 'url?limit=10000'
      },
      {
        test: /\.(ttf|eot)$/,
        loader: 'file'
      },
      // For Bootstrap 3
      {
        test: /bootstrap-sass\/assets\/javascripts\//,
        loader: 'imports?jQuery=jquery'
      }
    ]
  },
  plugins: [
    new webpack.NoErrorsPlugin(),
    new NodeTargetPlugin(),
    new WebpackErrorNotificationPlugin(),
    new HtmlWebpackPlugin({
      title: "Acacia"
    })
  ],
  externals: [
    'electron'
  ]
};
