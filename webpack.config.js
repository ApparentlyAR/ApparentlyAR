const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/react/index.js',
  output: {
    path: path.resolve(__dirname, 'public'),
    filename: 'react-bundle.js',
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env', '@babel/preset-react']
          }
        }
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  devtool: 'source-map'
};