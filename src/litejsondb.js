const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const log4js = require('log4js');

// Database directory and file
const DATABASE_DIR = 'database';
if (!fs.existsSync(DATABASE_DIR)) {
    try {
        fs.mkdirSync(DATABASE_DIR, { recursive: true });
    } catch (err) {
        console.error(`\x1b[31mOops! Unable to create the database directory. Check your permissions.\x1b[0m`);
        console.error(`\x1b[33mError details: ${err}\x1b[0m`);
        throw err;
    }
}

const DB_FILE = path.join(DATABASE_DIR, 'database.json');
if (!fs.existsSync(DB_FILE)) {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify({}));
    } catch (err) {
        console.error(`\x1b[31mOops! Unable to create the database file. Check your permissions.\x1b[0m`);
        console.error(`\x1b[33mError details: ${err}\x1b[0m`);
        throw err;
    }
}

// Logging configuration
log4js.configure({
    appenders: { LiteJsonDb: { type: 'file', filename: path.join(DATABASE_DIR, 'LiteJsonDb.log') } },
    categories: { default: { appenders: ['LiteJsonDb'], level: 'info' } }
});
const logger = log4js.getLogger('LiteJsonDb');

// Utility functions
const utils = {
    hashPassword: (password) => crypto.createHash('sha256').update(password).digest('hex'),

    checkPassword: (storedHash, password) => storedHash === utils.hashPassword(password),

    getOrDefault: (data, key, defaultValue = null) => data.hasOwnProperty(key) ? data[key] : defaultValue,

    keyExistsOrAdd: (data, key, defaultValue) => {
        if (data.hasOwnProperty(key)) {
            return true;
        }
        data[key] = defaultValue;
        return false;
    },

    searchData: (data, searchValue, key) => {
        const results = {};

        const searchRecursive = (d, value, currentKey = '') => {
            if (typeof d === 'object' && d !== null) {
                if (Array.isArray(d)) {
                    d.forEach((item, index) => searchRecursive(item, value, `${currentKey}/${index}`));
                } else {
                    Object.entries(d).forEach(([k, v]) => {
                        const newKey = currentKey ? `${currentKey}/${k}` : k;
                        if (typeof v === 'object' && v !== null) {
                            searchRecursive(v, value, newKey);
                        } else if (v === value || String(v) === String(value)) {
                            results[newKey] = v;
                        }
                    });
                }
            }
        };

        if (key) {
            if (data.hasOwnProperty(key)) {
                searchRecursive(data[key], searchValue);
            } else {
                console.error(`\x1b[31mOops! The key '${key}' does not exist. Searching is impossible!\x1b[0m`);
                console.error(`\x1b[33mTip: Verify the key or check available keys in the data structure.\x1b[0m`);
            }
        } else {
            searchRecursive(data, searchValue);
        }

        if (Object.keys(results).length === 0) {
            console.warn(`\x1b[33mNo matches found for '${searchValue}'. Keep searching, you might find it!\x1b[0m`);
            console.warn(`\x1b[33mTip: Try adjusting your search criteria or check if the value exists.\x1b[0m`);
        }

        return results;
    }
};

// Base class for JSON database operations
class JsonDB {
    constructor(filename = 'database.json') {
        this.filename = path.join(DATABASE_DIR, filename);
        this.db = {};
        this._loadDb();
    }

    _loadDb() {
        try {
            this.db = JSON.parse(fs.readFileSync(this.filename, 'utf-8'));
        } catch (err) {
            console.error(`\x1b[31mOops! Unable to load the database file. Check if the file is valid JSON.\x1b[0m`);
            console.error(`\x1b[33mError details: ${err}\x1b[0m`);
            throw err;
        }
    }

    _saveDb() {
        try {
            fs.writeFileSync(this.filename, JSON.stringify(this.db, null, 4));
            logger.info(`Database saved to ${this.filename}`);
        } catch (err) {
            console.error(`\x1b[31mOops! Unable to save the database file. Check your permissions.\x1b[0m`);
            console.error(`\x1b[33mError details: ${err}\x1b[0m`);
            throw err;
        }
    }

    _setChild(parent, childKey, value) {
        const keys = childKey.split('/');
        keys.slice(0, -1).forEach(key => parent = parent[key] = parent[key] || {});
        parent[keys[keys.length - 1]] = value;
    }

    _mergeDicts(dict1, dict2) {
        for (const [key, value] of Object.entries(dict2)) {
            if (typeof value === 'object' && value !== null && !Array.isArray(value) && dict1[key] && typeof dict1[key] === 'object') {
                dict1[key] = this._mergeDicts(dict1[key], value);
            } else {
                dict1[key] = value;
            }
        }
        return dict1;
    }

    keyExists(key) {
        const keys = key.split('/');
        let data = this.db;
        for (const k of keys) {
            if (k in data) {
                data = data[k];
            } else {
                return false;
            }
        }
        return true;
    }

    getData(key) {
        if (!key) {
            console.error(`\x1b[31mOops! No key provided. Please specify a valid key.\x1b[0m`);
            console.error(`\x1b[33mTip: Use a key path like 'users/1' to get specific data.\x1b[0m`);
            return null;
        }

        const keys = key.split('/');
        let data = this.db;
        for (const k of keys) {
            if (k in data) {
                data = data[k];
            } else {
                console.error(`\x1b[31mOops! The key '${key}' does not exist. Please check the key path.\x1b[0m`);
                console.error(`\x1b[33mTip: Use a valid key path like 'users/1' to get specific user data.\x1b[0m`);
                return null;
            }
        }
        return data;
    }

    setData(key, value = {}) {
        if (!this.validateData(value)) {
            console.error("\x1b[31mOops! The provided data is not in a valid format. Use an object with consistent types.\x1b[0m");
            console.error(`\x1b[33mTip: Ensure keys have consistent types and values are of allowed types.\x1b[0m`);
            return;
        }
        if (this.keyExists(key)) {
            console.error(`\x1b[31mOops! The key '${key}' already exists. Use 'editData' to modify the existing key.\x1b[0m`);
            console.error(`\x1b[33mTip: If you want to update or add a new key, use db.editData('${key}', newValue).\x1b[0m`);
            return;
        }
        this._setChild(this.db, key, value);
        this._saveDb();
    }

    editData(key, value) {
        if (!this.keyExists(key)) {
            console.error(`\x1b[31mOops! The key '${key}' does not exist. Unable to edit non-existent data.\x1b[0m`);
            console.error(`\x1b[33mTip: Use db.setData('${key}', value) to add a new key.\x1b[0m`);
            return;
        }
        const currentData = this.getData(key);
        this._setChild(this.db, key, this._mergeDicts(currentData, value));
        this._saveDb();
    }

    deleteData(key) {
        if (!this.keyExists(key)) {
            console.error(`\x1b[31mOops! The key '${key}' does not exist. Unable to delete non-existent data.\x1b[0m`);
            console.error(`\x1b[33mTip: Ensure you use a valid key path like 'users/1' to delete specific user data.\x1b[0m`);
            return;
        }
        const keys = key.split('/');
        let data = this.db;
        keys.slice(0, -1).forEach(k => data = data[k]);
        delete data[keys[keys.length - 1]];
        this._saveDb();
    }

    showDb() {
        return this.db;
    }
    
    hashPassword = utils.hashPassword;
    checkPassword = utils.checkPassword;
    getOrDefault = utils.getOrDefault;
    keyExistsOrAdd = utils.keyExistsOrAdd;
    searchData = utils.searchData;
    sanitizeOutput = (data) => JSON.stringify(data, null, 2);
    prettyPrint = (data) => console.log(JSON.stringify(data, null, 2));

    validateData(data) {
        return typeof data === 'object' && data !== null;
    }
}

module.exports = JsonDB;
