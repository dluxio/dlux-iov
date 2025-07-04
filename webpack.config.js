const path = require('path');
const webpack = require('webpack');

module.exports = {
  mode: 'production',
  entry: './src/collaboration-bundle.js',
  output: {
    filename: 'tiptap-collaboration.bundle.js',
    path: path.resolve(__dirname, 'js'),
    library: 'TiptapCollaboration',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  externals: {
    // Don't bundle these - assume they're available globally or via CDN
    'bootstrap': 'bootstrap'
  },
  resolve: {
    extensions: ['.js', '.ts'],
    fallback: {
      "crypto": false,
      "stream": false,
      "buffer": false
    }
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
            plugins: ['@babel/plugin-transform-runtime']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      }
    ]
  },
  optimization: {
    minimize: true, // Enable minification for production
    splitChunks: false, // Completely disable code splitting
    runtimeChunk: false // Don't create separate runtime chunk
  },
  plugins: [
    new webpack.optimize.LimitChunkCountPlugin({
      maxChunks: 1 // Force everything into a single chunk
    })
  ]
};