const path = require("path");
const webpack = require("webpack");

module.exports = {
  entry: "./src/index.js",
  optimization: {
    minimize: true
  },
  target: "webworker",
  output: {
    //globalObject: 'this',
    filename: "index.js",
    path: path.resolve(__dirname, "bin"),
    libraryTarget: "this",
  },
  module: {
    // Asset modules are modules that allow the use asset files (fonts, icons, etc) 
    // without additional configuration or dependencies.
    rules: [
      // asset/source exports the source code of the asset. 
      // Usage: e.g., import notFoundPage from "./page_404.html"
      {
        test: /\.(txt|html)/,
        type: "asset/source",
      },
      {
        test: /\.ya?ml$/,
        use: 'yaml-loader',
        type: 'json'
      }
    ],
  },
  resolve: {
    fallback: {
      // util: false, // do not include a polyfill for abc
      util: require.resolve("core-js/"), // use the core js
      url: require.resolve("core-js/"), // use the core js
      fs: require.resolve("core-js/"), // use the core js
      http: require.resolve("stream-http"),
      https: require.resolve("https-browserify"),
      buffer: require.resolve('buffer'),
      process: require.resolve("process"),      
    }
  },
  plugins: [
    // Polyfills go here.
    // Used for, e.g., any cross-platform WHATWG, 
    // or core nodejs modules needed for your application.
    new webpack.ProvidePlugin({
      URL: "core-js/web/url",
      process: 'process/browser',
    }),
  ],
};
