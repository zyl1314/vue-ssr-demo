const path = require('path');
const projectRoot = path.resolve(__dirname, '..');

module.exports = {
  // 此处告知 server bundle 使用 Node 风格导出模块(Node-style exports)
  target: 'node', 
  entry: path.join(projectRoot, 'src/entry-server.js'),
  output: {
    libraryTarget: 'commonjs2', // !different
    path: path.join(projectRoot, 'dist'),
    filename: 'bundle.server.js',
  },
  module: {
    rules: [
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.js$/,
        loader: 'babel-loader',
        include: projectRoot,
        exclude: /node_modules/,
      },
    ]
  },
  resolve: {
    alias: {
      'vue$': 'vue/dist/vue.runtime.esm.js' 
    }
  }
}