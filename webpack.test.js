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
  devtool: 'eval-source-map',

  module: {
    loaders: [
      {
        test: /\.ts$/,
        loaders: ['awesome-typescript-loader?tsconfig=tsconfig.test.json' , 'angular2-template-loader'],
        exclude: [/\.e2e\.ts$/]

      },
      {
        test: /\.html$/,
        loader: 'raw-loader',
        exclude: [helpers.root('src', 'client', 'index.html')]
      },
      // {
      //   test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
      //   loader: 'file?name=assets/[name].[hash].[ext]'
      // },
      // {
      //   test: /\.scss$/,
      //   exclude: helpers.root('src', 'app'),
      //   loader: ExtractTextPlugin.extract('style', 'css?sourceMap')
      // },
      {
        test: /\.css$/,
        include: helpers.root('src', 'client', 'app'),
        loaders: ['to-string-loader', 'css-loader']
      }

    ],
    postLoaders: [
      {
        test: /\.ts$/,
        include: helpers.root('src', 'client'),
        loader: 'istanbul-instrumenter-loader',
        exclude: [/\.spec\.ts$/, /\.e2e\.ts$/, /node_modules/]
      }
    ]
  },
  
  output: {
    path: helpers.root('dist', 'client'),
    filename: '[name].js',
    publicPath: '/'
  },

  plugins: [
    // new webpack.optimize.UglifyJsPlugin({
    //   beautify: false,
    //   mangle: { screw_ie8 : true }, 
    //   compress: { screw_ie8: true }, 
    //   comments: false 
    // }),

    // new HtmlWebpackPlugin({
    //   template: 'src/index.html'
    // })
  ]
};