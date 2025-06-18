// helper tools for litejsondb
const crypto = require('crypto');
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

// Lightweight LRU cache 
class LRUCache {
  constructor(maxSize = 1000) {
    this.maxSize = maxSize;
    this.cache = new Map();
  }
  get(key) {
    if (!this.cache.has(key)) return undefined;
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }
  set(key, value) {
    if (this.cache.has(key)) this.cache.delete(key);
    else if (this.cache.size >= this.maxSize) {
      this.cache.delete(this.cache.keys().next().value);
    }
    this.cache.set(key, value);
  }
  clear() { this.cache.clear(); }
}

// Simple ID gen
function autoId(prefix = '') {
  const id = crypto.randomBytes(5).toString('hex');
  return prefix ? `${prefix}/${id}` : id;
}

// Deep clone object
function deepClone(source) {
  return JSON.parse(JSON.stringify(source));
}

// Compress JSON as buffer
function compressJSON(data) {
  const json = typeof data === 'string' ? data : JSON.stringify(data);
  return zlib.gzipSync(Buffer.from(json));
}

// Decompress to JSON object
function decompressJSON(buffer) {
  const json = zlib.gunzipSync(buffer).toString('utf-8');
  return JSON.parse(json);
}

// Validate simple object shape
function validateObject(obj, schema) {
  if (typeof obj !== 'object' || !obj) return false;
  for (const key in schema) {
    if (schema.hasOwnProperty(key)) {
      const expectedType = schema[key];
      const actualType = Array.isArray(obj[key]) ? 'array' : typeof obj[key];
      if (actualType !== expectedType) return false;
    }
  }
  return true;
}

// Snapshot save
function saveSnapshot(db, name = 'snapshot') {
  const file = path.join(db.dbDir, `${name}.json`);
  fs.writeFileSync(file, JSON.stringify(db.db, null, 2));
  db._log(`Snapshot '${name}' created. Say cheese!`);
  return file;
}

// Restore snapshot
function loadSnapshot(db, name = 'snapshot') {
  const file = path.join(db.dbDir, `${name}.json`);
  if (!fs.existsSync(file)) throw new Error(`Snapshot '${name}' not found. It must have been stolen.`);
  const raw = fs.readFileSync(file, 'utf8');
  db.db = JSON.parse(raw);
  db.saveNow();
  db._log(`Snapshot '${name}' restored. Back to the future!`);
}

module.exports = {
  LRUCache, autoId, deepClone, compressJSON, decompressJSON,
  validateObject, saveSnapshot, loadSnapshot
};
