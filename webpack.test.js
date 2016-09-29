var webpack = require('webpack');

var path = require('path');
var _root = path.resolve(__dirname);
function root(args) {
  args = Array.prototype.slice.call(arguments, 0);
  return path.join.apply(path, [_root].concat(args));
}
var helpers = { root: root };

module.exports = {
  resolve: {
    extensions: ['', '.js', '.ts'],
    root: helpers.root('src/client/'),
  },

  // externals: {
  //   "jquery": "jQuery"
  // },
  devtool: 'inline-source-map',

  module: {
    loaders: [
      {
        test: /\.ts$/,
        loaders: ['awesome-typescript-loader?tsconfig=tsconfig.test.json' , 'angular2-template-loader'],
        exclude: [/\.e2e\.ts$/]

      },
      {
        test: /\.(html|json)$/,
        loader: 'raw-loader',
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

    ],
    postLoaders: [
      {
        test: /\.ts$/,
        include: helpers.root('src', 'client'),
        loader: 'istanbul-instrumenter-loader',
        exclude: [/\.spec\.ts$/, /\.e2e\.ts$/, /\.d\.ts$/, /node_modules/, /testUtils/]
      }
    ]
  },
  
  output: {
    path: helpers.root('dist', 'client'),
    filename: '[name].js',
    publicPath: '/'
  },

  plugins: []
};