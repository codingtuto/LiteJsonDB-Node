const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { LRUCache } = require('./utils');

const COLORS = {
  reset: '\u001b[0m', red: '\u001b[31m', yellow: '\u001b[33m',
  green: '\u001b[32m]', cyan: '\u001b[36m'
};
const DEFAULT_DB_DIR = 'database';
const DEFAULT_DB_FILE = 'database.json';

function ensureDirectoryExists(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

/* JSONDBCORE - V2.0 */
class JsonDBCore {
  constructor({
    dbDir = DEFAULT_DB_DIR, filename = DEFAULT_DB_FILE, enableLog = false,
    enableSave = true, debounceMS = 200, cacheSize = 1000
  } = {}) {
    this.dbDir = dbDir;
    this.filePath = path.join(dbDir, filename);
    this.enableLog = !!enableLog;
    this.enableSave = !!enableSave;
    this.debounceMS = debounceMS;
    this._saveTimer = null;
    this.plugins = [];
    this.hooks = {};
    this.custom = {};
    this.pathCache = new LRUCache(cacheSize);
    this.dirtyKeys = new Set();
    ensureDirectoryExists(this.dbDir);
    if (!fs.existsSync(this.filePath)) fs.writeFileSync(this.filePath, '{}');
    this._load();
  }

  _log(msg) { if (this.enableLog) console.log(`${COLORS.green}[Info]${COLORS.reset}`, msg); }
  _warn(msg) { console.warn(`${COLORS.yellow}[Warning]${COLORS.reset}`, msg); }
  _error(msg) { console.error(`${COLORS.red}[CRITICAL ERROR]${COLORS.reset}`, msg); }
  _notify(msg) { if (this.enableLog) console.log(`${COLORS.cyan}[Notice]${COLORS.reset}`, msg); }

  _load() {
    try {
      const raw = fs.readFileSync(this.filePath, 'utf-8');
      this.db = raw.trim() ? JSON.parse(raw) : {};
      this.pathCache.clear();
      this._log('Database loaded. Data is safe and sound.');
    } catch (err) {
      this._error('Failed to load DB. The file may be corrupt or on vacation.');
      this.db = {};
    }
  }
  
  _saveAsync() {
    if (!this.enableSave) return;
    setImmediate(() => {
      try {
        fs.writeFileSync(this.filePath, JSON.stringify(this.db));
        this.dirtyKeys.clear();
        this._log('Save performed. Data is safe.');
      } catch (err) {
        this._error('Save failed! All hands on deck! ' + err.message);
      }
    });
  }

  _scheduleSave() {
    if (!this.enableSave) return;
    if (this._saveTimer) clearTimeout(this._saveTimer);
    this._saveTimer = setTimeout(() => this._saveAsync(), this.debounceMS);
  }

  _invalidateCache(key) {
    this.pathCache.set(key, undefined);
    const parts = key.split('/');
    for (let i = 1; i < parts.length; i++) {
      this.pathCache.set(parts.slice(0, i).join('/'), undefined);
    }
    this.dirtyKeys.add(key);
  }

  saveNow() {
    if (!this.enableSave) {
      this._warn("Saving is disabled. I hope you know what you're doing!");
      return;
    }
    fs.writeFileSync(this.filePath, JSON.stringify(this.db));
    this.dirtyKeys.clear();
    this._log('Forced save successful. That was intense.');
  }

  has(key) {
    return this.get(key) !== null;
  }

  get(key) {
    if (!key || typeof key !== 'string') return null;
    const cached = this.pathCache.get(key);
    if (cached !== undefined) return cached;
    const parts = key.split('/');
    let current = this.db;
    for (const part of parts) {
      if (!current || typeof current !== 'object') return null;
      current = current[part];
    }
    this.pathCache.set(key, current);
    return current ?? null;
  }

  set(key, value, options = {}) {
    if (!key || typeof key !== 'string') {
      this._error("Invalid key. A key must be a string, not a prose poem.");
      return false;
    }
    
    // IMPROVEMENT: beforeSet hooks can transform the value.
    let finalValue = this._runHooks('beforeSet', key, value);

    const parts = key.split('/');
    let cur = this.db;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]] || typeof cur[parts[i]] !== 'object') cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    const finalKey = parts[parts.length - 1];
    cur[finalKey] = finalValue;
    this._invalidateCache(key);
    this._scheduleSave();
    this._runHooks('afterSet', key, finalValue);
    return true;
  }

  merge(key, value) {
    if (!this.has(key)) {
      this._error(`Merge failed. The key '${key}' not found. It must have disappeared.`);
      return false;
    }
    const ref = this.get(key);
    if (typeof ref === 'object' && ref !== null && typeof value === 'object' && value !== null) {
      Object.assign(ref, value);
      this._invalidateCache(key);
      this._scheduleSave();
      return true;
    }
    this._warn(`Merge failed. You can't mix carrots and floppy disks. Incompatible type at '${key}'.`);
    return false;
  }

  delete(key) {
    this._runHooks('beforeDelete', key);
    if (!this.has(key)) {
      this._warn(`Nothing to delete. The key '${key}' has already left for a trip around the world.`);
      return false;
    }
    const parts = key.split('/');
    const last = parts.pop();
    const parent = this.get(parts.join('/')); 
    if (parent && typeof parent === 'object') {
        delete parent[last];
        this._invalidateCache(key);
        this._scheduleSave();
        this._runHooks('afterDelete', key);
        return true;
    }
    return false;
  }

  increment(key, amount = 1) {
    const current = this.get(key);
    const value = typeof current === 'number' ? current + amount : amount;
    this.set(key, value);
    return value;
  }

  on(hookName, callback) {
    if (!this.hooks[hookName]) this.hooks[hookName] = [];
    this.hooks[hookName].push(callback);
  }

  _runHooks(name, key, value) {
    const hooks = this.hooks[name];
    if (!hooks || hooks.length === 0) return value; 
    
    let finalValue = value;
    for (const cb of hooks) {
      try {
        const result = cb(key, finalValue, this);
        // CRITICAL FIX: If a beforeSet hook returns a value, we use it.
        if (name === 'beforeSet' && result !== undefined) {
          finalValue = result;
        }
      } catch (err) {
        this._warn(`The hook '${name}' stumbled: ${err.message}`);
        if (name.startsWith('before')) throw err; // Stops this insane operation.... error coming
      }
    }
    return finalValue;
  }
  
  use(pluginFn) {
    try {
      if (typeof pluginFn === 'function') {
        pluginFn(this, this.custom);
        this.plugins.push(pluginFn);
        this._log(`🔌 Plugin '${pluginFn.name || 'anonymous'}' plugged in successfully!`);
      } else {
        throw new Error("This is not a function. I was expecting a plugin, not a toaster.");
      }
    } catch (err) {
      this._error(`Failed to load plugin: ${err.message}`);
    }
  }
}

module.exports = JsonDBCore;
