var webpack = require('webpack');
var CopyWebpackPlugin = require('copy-webpack-plugin');

var path = require('path');
var _root = path.resolve(__dirname);
function root(args) {
  args = Array.prototype.slice.call(arguments, 0);
  return path.join.apply(path, [_root].concat(args));
}
var helpers = { root: root };

module.exports = {
  entry: {
    'polyfills': helpers.root('src', 'client', 'polyfills.ts'),
    'vendor': helpers.root('src', 'client', 'vendor.ts'),
    'app': helpers.root('src', 'client', 'main.ts')
  },

  resolve: {
    extensions: ['', '.js', '.ts']
  },

  devtool: 'cheap-module-source-map',

  module: {
    loaders: [
      {
        test: /\.ts$/,
        loaders: ['awesome-typescript-loader', 'angular2-template-loader'],
        exclude: [/\.(spec|e2e)\.ts$/]
      },
      {
        test: /\.html$/,
        loader: 'raw',
        exclude: [helpers.root('src', 'client', 'index.html')]
      },
      {
        test: /\.(png|woff|woff2|eot|ttf|svg)$/,
        loader: 'url-loader?limit=100000'
      },
      {
        test: /\.scss$/,
        loaders: ['css-to-string-loader', 'css', 'sass']
      },
      {
        test: /\.css$/,
        loaders: ['css-to-string-loader', 'css']
      }

    ]
  },
  output: {
    path: helpers.root('dist', 'client'),
    filename: '[name].js',
    publicPath: '/'
  },

  plugins: [
    new webpack.optimize.CommonsChunkPlugin({
      name: ['app', 'vendor', 'polyfills']
    }),
    new CopyWebpackPlugin([
      {
        from: helpers.root('src', 'client', 'assets'),
        to: helpers.root('dist', 'client', 'assets'),
      }
    ]),
    new webpack.DefinePlugin({
      'process.env': {
        NODE_ENV: JSON.stringify('development')
      }
    })
  ]
};