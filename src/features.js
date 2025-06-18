// extra functionalities
const fs = require('fs');
const path = require('path');

function applyFeatures(db) {
  // 🔄Subscriptions
  db.subscribers = {};
  db.subscribe = function (path, callback) {
    if (!this.subscribers[path]) this.subscribers[path] = [];
    this.subscribers[path].push(callback);
    this._log(`New subscriber for '${path}'. They won't miss a thing!`);
  };

  const originalRunHooks = db._runHooks.bind(db);
  db._runHooks = function (name, key, value) {
    const result = originalRunHooks(name, key, value);
    if (name === 'afterSet' && this.subscribers[key]) {
      this.subscribers[key].forEach(cb => {
        try { cb(value); } catch (err) { this._warn(`Subscription failed: ${err.message}`); }
      });
    }
    return result; 
  };

  // 🛑 Read-Only Mode
  db._readonly = false;
  db.readonly = function (enabled = true) {
    this._readonly = !!enabled;
    this._log('Read-Only mode: ' + (enabled ? 'ENABLED. Do not touch anything!' : 'DISABLED. Enjoy yourself!'));
  };

  // 🧷 Key Locking
  db._locked = new Set();
  db.lock = function (key) { this._locked.add(key); this._log(`Key '${key}' locked. Better than a safe.`); };
  db.unlock = function (key) { this._locked.delete(key); this._log(`Key '${key}' unlocked. The path is clear.`); };

  // IMPROVEMENT
  const protectWriteMethods = (methodName) => {
    const originalMethod = db[methodName].bind(db);
    db[methodName] = function (key, ...args) {
      if (this._readonly) {
        this._warn(`[Read-Only] Action '${methodName}' blocked. The database is napping.`);
        return false;
      }
      if (this._locked.has(key)) {
        this._warn(`[Locked] Cannot perform '${methodName}' on key '${key}'. It is under high protection.`);
        return false;
      }
      return originalMethod(key, ...args);
    };
  };

  ['set', 'delete', 'merge', 'increment'].forEach(protectWriteMethods);

  // 🧠 Query System.... SQL enthusiasts make it more efficient 
  db.query = function (baseKey, filterFn) {
    const base = this.get(baseKey);
    if (!base || typeof base !== 'object') return [];
    return Object.entries(base)
      .map(([k, v]) => ({ path: `${baseKey}/${k}`, value: v }))
      .filter(({ value, path }) => {
        try {
          return filterFn(value, path.split('/').pop());
        } catch (e) {
          this._warn(`Query error on ${path}: ${e.message}`);
          return false;
        }
      });
  };

  // 🛠 Migration System
  db.migrate = function (transformFn) {
    try {
      this._log('Migration started... Hold on tight!');
      transformFn(this);
      this.saveNow();
      this._log('Migration successful! The database has evolved.');
    } catch (e) {
      this._error('Migration failed! The database spirits are not happy. ' + e.message);
    }
  };
}

module.exports = applyFeatures;