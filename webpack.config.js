const path = require('path');

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
    extensions: ['.js', '.ts']
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
      }
    ]
  },
  optimization: {
    minimize: false // Keep readable for debugging
  }
};