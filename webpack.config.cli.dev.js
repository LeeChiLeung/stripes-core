// Top level Webpack configuration for running a development environment
// from the command line via devServer.js

const webpack = require('webpack');
const postCssImport = require('postcss-import');
const autoprefixer = require('autoprefixer');
const postCssCustomProperties = require('postcss-custom-properties');
const postCssCalc = require('postcss-calc');
const postCssNesting = require('postcss-nesting');
const postCssCustomMedia = require('postcss-custom-media');
const postCssMediaMinMax = require('postcss-media-minmax');
const postCssColorFunction = require('postcss-color-function');
const cloneDeep = require('lodash.clonedeep');

const base = require('./webpack.config.base');
const cli = require('./webpack.config.cli');

const devConfig = Object.assign({}, base, cli, {
  devtool: 'inline-source-map',
  mode: 'development',
});

// Override filename to remove the hash in development due to memory issues (STCOR-296)
devConfig.output.filename = 'bundle.js';

devConfig.entry.unshift('webpack-hot-middleware/client');

devConfig.plugins = devConfig.plugins.concat([
  new webpack.HotModuleReplacementPlugin(),
]);

const cssConfig = [
    {
      loader: 'style-loader',
      options: {
        sourceMap: true,
      },
    },
    {
      loader: 'css-loader',
      options: {
        localIdentName: '[local]---[hash:base64:5]',
        modules: true,
        sourceMap: true,
        importLoaders: 1,
      },
    },
    {
      loader: 'postcss-loader',
      options: {
        plugins: () => [
          postCssImport(),
          autoprefixer(),
          postCssCustomProperties({
            preserve: false
          }),
          postCssCalc(),
          postCssNesting(),
          postCssCustomMedia(),
          postCssMediaMinMax(),
          postCssColorFunction(),
        ],
        sourceMap: true,
      },
    },
];

const cssConfig2 = cloneDeep(cssConfig);
if (cssConfig2[1].options.modules) {
  delete cssConfig2[1].options.modules;
  // console.log('1', JSON.stringify(cssConfig2));
} else {
  throw 'no modules config for CSS';
}

devConfig.module.rules.push({
  test: /\.css$/,
  use: cssConfig,
},{
  test: /\.global-css$/,
  use: cssConfig2,
});

devConfig.module.rules.push(
  {
    test: /\.svg$/,
    use: [{ loader: 'file-loader?name=img/[path][name].[hash].[ext]' }]
  },
);

module.exports = devConfig;
