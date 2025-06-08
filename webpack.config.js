const path = require('path');

module.exports = {
  mode: 'production',
  entry: './.src/index.js',
  output: {
    path: path.resolve(__dirname, 'packages'),
    filename: 'hocuspocus-provider.bundle.js',
    library: {
      name: 'CollaborationBundle',
      type: 'umd',
      export: 'default'
    },
    globalObject: 'this'
  }
};