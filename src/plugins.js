// plugins.js — default plugin pack for litejsondb [READ THE DOC TO CREATE YOUR OWN PLUGINGS]

// 📦 Auto-backup 
function AutoBackupPlugin(db) {
  const fs = require('fs');
  const path = require('path');
  const backupDir = path.join(db.dbDir, 'backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir);

  db.on('afterSet', () => {
    const name = new Date().toISOString().replace(/[:.]/g, '-');
    const file = path.join(backupDir, `backup-${name}.json`);
    fs.writeFileSync(file, JSON.stringify(db.db, null, 2));
    db._log(`[Backup] That's the one! Backup created: ${file}`);
  });
}

// 📝 Change logger 
function ChangeLoggerPlugin(db) {
  db.on('afterSet', (key, value) => console.log(`[Logger] ✍️  Set ${key} =`, value));
  db.on('afterDelete', (key) => console.log(`[Logger] 🗑️  Deleted ${key}`));
}

// 🔁 Auto cast
function AutoCastPlugin(db) {
  db.on('beforeSet', (key, value) => {
    if (typeof value !== 'string') return value;
    
    // CRITICAL FIX: We return the new value instead of calling db.set()
    if (/^-?\d+$/.test(value)) return parseInt(value, 10);
    if (/^-?\d+\.\d+$/.test(value)) return parseFloat(value);
    if (value === 'true') return true;
    if (value === 'false') return false;
    if (value.startsWith('[') && value.endsWith(']')) {
      try { return JSON.parse(value); } catch {}
    }
    if (value.startsWith('{') && value.endsWith('}')) {
      try { return JSON.parse(value); } catch {}
    }
    return value; // LET'S RETURN DATA IF ERROR
  });
}

// ⏳ Expiry 
function ExpiryPlugin(db) {
  db.custom.expiryMap = db.custom.expiryMap || {};
  db.expire = function (key, ms) {
    if (db.custom.expiryMap[key]) clearTimeout(db.custom.expiryMap[key]);
    db.custom.expiryMap[key] = setTimeout(() => {
      this.delete(key);
      this._log(`[Expire] 💨 Poof! The key '${key}' evaporated after ${ms}ms.`);
      delete db.custom.expiryMap[key];
    }, ms);
    this._log(`[Expire] Countdown started for '${key}' (${ms}ms).`);
  };
}

// 📐 Schema validator
function SchemaValidatorPlugin(db) {
  db.custom.schemas = db.custom.schemas || {};
  db.defineSchema = function (key, structure) {
    this.custom.schemas[key] = structure;
  };
  db.on('beforeSet', (key, value) => {
    const schema = db.custom.schemas[key];
    if (!schema) return;

    for (const prop in schema) {
      if (schema.hasOwnProperty(prop)) {
        const expected = schema[prop];
        const actual = Array.isArray(value[prop]) ? 'array' : typeof value[prop];
        if (actual !== expected) {
          throw new Error(`[Schema] No, no, no! '${prop}' must be of type '${expected}', but received '${actual}'.`);
        }
      }
    }
  });
}

module.exports = {
  AutoBackupPlugin,
  ChangeLoggerPlugin,
  AutoCastPlugin,
  ExpiryPlugin,
  SchemaValidatorPlugin
};