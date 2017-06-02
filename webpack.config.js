const path = require('path');
module.exports = {
  entry: {
    app: './src/vt.js',
  },
  output: {
    path: path.resolve(__dirname, 'build'),
    filename: 'vt.js',
    publicPath: '/build/'
  },
  module: {
    loaders: [
      {
        test: /\.js$/,
        exclude: /(node_modules)/,
        loader: 'babel-loader',
        query: {
          presets: ['es2015']
        }
      }
    ]
  },
  devtool: 'source-map'
};
