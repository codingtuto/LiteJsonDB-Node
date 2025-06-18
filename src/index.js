const JsonDBCore = require('./core');
const features = require('./features');
const plugins = require('./plugins');
const utils = require('./utils');

class LiteJsonDB extends JsonDBCore {
  /**
   * Initializes a complete LiteJsonDB instance with all features.
   * @param {object} config - Database configuration.
   */
  constructor(config) {
    super(config);
    features(this);
    this.utils = utils;
    this.pluginPacks = { ...plugins };
    this._log('LiteJsonDB initialized with the full stack! Ready to break everything.');
  }

  /**
   * User-friendly alias for the merge method.
   * @param {string} key - The key of the object to modify.
   * @param {object} object - The object containing the new key/value pairs.
   */
  edit(key, object) {
    return this.merge(key, object);
  }

  /**
   * Activates one or more plugins on the database instance.
   * @param {...Function} plugins - A list of plugin functions to activate.
   */
  activate(...plugins) {
    if (plugins.length === 0) {
      this._warn("The 'activate' function was called without plugins. Did you wake me up for nothing?");
      return;
    }
    
    for (const plugin of plugins) {
      const name = plugin.name || 'anonymous';
      try {
        if (typeof plugin === 'function') {
          this.use(plugin);
        } else {
            this._warn(`[Plugin] '${name}' looks suspicious. It's not a function, I'll pass.`);
        }
      } catch (err) {
        this._error(`[Plugin] Ouch! Activation of plugin '${name}' failed: ${err.message}`);
      }
    }
    this._notify('All requested plugins have been activated. The machine is running!');
  }
}

module.exports = LiteJsonDB;