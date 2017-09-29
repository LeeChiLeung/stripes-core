const fs = require('fs');
const path = require('path');
const assert = require('assert');
const _ = require('lodash');
const VirtualModulesPlugin = require('webpack-virtual-modules');
const serialize = require('serialize-javascript');

// This webpack plugin generates a virtual module containing the stripes configuration
// To access this configuration simply import 'stripes-config' within your JavaScript:
//   import { okapi, config, modules } from 'stripes-config';
module.exports = class StripesConfigPlugin {
  constructor(options) {
    assert(_.isObject(options.modules), 'stripes-config-plugin was not provided a "modules" object for enabling stripes modules');
    this.options = options;
  }

  apply(compiler) {
    const enabledModules = this.options.modules;
    const moduleConfigs = parseStripesModules(enabledModules, compiler.context);
    const mergedConfig = Object.assign({}, this.options, { modules: moduleConfigs} );

    // Create a virtual module for Webpack to include in the build
    compiler.apply(new VirtualModulesPlugin({
      'node_modules/stripes-config.js': `module.exports = ${serialize(mergedConfig, {space: 2})}`
    }));
  }
}

// Generates stripes configuration for the tenant's enabled modules
function parseStripesModules(enabledModules, context) {
  let moduleConfigs = {};
  _.forOwn(enabledModules, (moduleConfig, moduleName) => {
    const { stripes, description, version } = loadDefaults(context, moduleName);
    const stripeConfig = Object.assign({}, stripes, moduleConfig, {
      module: moduleName,
      getModule: eval(`() => require('${moduleName}').default`), // eslint-disable-line no-eval
      description: description,
      version: version
    });
    delete stripeConfig.type;
    moduleConfigs[stripes.type] = appendOrSingleton(moduleConfigs[stripes.type], stripeConfig);
  });
  return moduleConfigs;
}

// Loads description, version, and stripes configuration from a module's package.json
function loadDefaults(context, moduleName) {
  const aPath = require.resolve(path.join(context, 'node_modules', moduleName, '/package.json'));
  const { stripes, description, version } = require(aPath);
  assert(_.isObject(stripes, `included module ${moduleName} does not have a "stripes" key in package.json`));
  assert(_.isString(stripes.type, `included module ${moduleName} does not specify stripes.type in package.json`));
  return { stripes, description, version };
}

function appendOrSingleton(maybeArray, newValue) {
  const singleton = [newValue];
  if (Array.isArray(maybeArray)) return maybeArray.concat(singleton);
  return singleton;
};
