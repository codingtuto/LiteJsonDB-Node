const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const log4js = require('log4js');
require('dotenv').config();

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
     },

     flattenJSON: (data) => {
          const result = {};
          const flatten = (obj, parentKey = '') => {
               for (const [key, value] of Object.entries(obj)) {
                    const newKey = parentKey ? `${parentKey}.${key}` : key;
                    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
                         flatten(value, newKey);
                    } else {
                         result[newKey] = value;
                    }
               }
          };
          flatten(data);
          return result;
     },

     convertToDateTime: (timestamp) => new Date(timestamp).toLocaleString(),

     prettyPrint: (data) => console.log(JSON.stringify(data, null, 2)),

     sanitizeOutput: (data) => JSON.stringify(data, null, 2)
};


// Base class for JSON database operations
class JsonDB {
     constructor(filename = 'database.json', options = { encrypt: false }) {
          this.filename = path.join(DATABASE_DIR, filename);
          this.db = {};
          this.encrypt = options.encrypt;

          this.key = process.env.SECRET_KEY || "default_key";
          this._initializeDbFile();
          this._loadDb();
     }

     _encrypt(text) {
          const xorText = text.split('').map((char, index) => {
               return String.fromCharCode(char.charCodeAt(0) ^ this.key.charCodeAt(index % this.key.length));
          }).join('');
          return Buffer.from(xorText, 'utf8').toString('base64');
     }

     _decrypt(encodedText) {
          const decodedText = Buffer.from(encodedText, 'base64').toString('utf8');
          return decodedText.split('').map((char, index) => {
               return String.fromCharCode(char.charCodeAt(0) ^ this.key.charCodeAt(index % this.key.length));
          }).join('');
     }

     _initializeDbFile() {
          if (!fs.existsSync(this.filename)) {
               const initialData = this.encrypt ? this._encrypt('{}') : '{}';
               fs.writeFileSync(this.filename, initialData);
          }
     }

     _loadDb() {
          try {
               let data = fs.readFileSync(this.filename, 'utf-8');
               if (this.encrypt) {
                    data = this._decrypt(data);
               }
               this.db = JSON.parse(data);
          } catch (err) {
               console.error(`\x1b[31mOops! Unable to load the database file. Check if the file is valid JSON.\x1b[0m`);
               throw err;
          }
     }

     _saveDb() {
          try {
               let data = JSON.stringify(this.db, null, 4);
               if (this.encrypt) {
                    data = this._encrypt(data);
               }
               fs.writeFileSync(this.filename, data);
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
          if (typeof value === 'object') {
               for (const [k, v] of Object.entries(value)) {
                    this._validateWithRegex(k, v);
               }
          } else {
               this._validateWithRegex(key, value);
          }

          if (this.keyExists(key)) {
               console.error(`\x1b[31mOops! The key '${key}' already exists. Use 'editData' to modify the existing key.\x1b[0m`);
               return;
          }

          this._setChild(this.db, key, value);
          this._saveDb();
     }

     editData(key, value) {
          if (!this.keyExists(key)) {
               console.error(`\x1b[31mOops! The key '${key}' does not exist. Unable to edit non-existent data.\x1b[0m`);
               return;
          }

          const currentData = this.getData(key);

          if (typeof value === 'object') {
               for (const [k, v] of Object.entries(value)) {
                    this._validateWithRegex(k, v);
               }
          } else {
               this._validateWithRegex(key, value);
          }

          this._setChild(this.db, key, this._mergeDicts(currentData, value));
          this._saveDb();
     }

     setSubcollection(parentKey, subcollectionKey, subcollectionData) {
          if (!this.keyExists(parentKey)) {
               console.error(`\x1b[31mOops! The parent key '${parentKey}' does not exist. Unable to add subcollection.\x1b[0m`);
               return;
          }

          const parentData = this.getData(parentKey);
          if (!parentData[subcollectionKey]) {
               parentData[subcollectionKey] = {};
          }

          parentData[subcollectionKey] = { ...parentData[subcollectionKey], ...subcollectionData };
          this.editData(parentKey, parentData);
          console.log(`Subcollection '${subcollectionKey}' added/updated for parent '${parentKey}'.`);
     }

     editSubcollection(parentKey, subcollectionKey, subcollectionData) {
          if (!this.keyExists(`${parentKey}/${subcollectionKey}`)) {
               console.error(`\x1b[31mOops! The sub-collection '${subcollectionKey}' under '${parentKey}' does not exist. Unable to edit.\x1b[0m`);
               return;
          }

          const subcollectionDataCurrent = this.getData(`${parentKey}/${subcollectionKey}`);
          const mergedData = this._mergeDicts(subcollectionDataCurrent, subcollectionData);

          this.setSubcollection(parentKey, subcollectionKey, mergedData);
          console.log(`Subcollection '${subcollectionKey}' updated for parent '${parentKey}'.`);
     }

     getSubcollection(parentKey, subcollectionKey = null) {
          if (!this.keyExists(parentKey)) {
               console.error(`\x1b[31mOops! The parent key '${parentKey}' does not exist. Unable to get sub-collection.\x1b[0m`);
               return null;
          }

          const parentData = this.getData(parentKey);
          if (subcollectionKey) {
               return parentData[subcollectionKey] || null;
          }
          return parentData;
     }

     deleteSubcollection(parentKey, subcollectionKey) {
          if (!this.keyExists(`${parentKey}/${subcollectionKey}`)) {
               console.error(`\x1b[31mOops! The sub-collection '${subcollectionKey}' under '${parentKey}' does not exist. Unable to delete.\x1b[0m`);
               return;
          }

          const parentData = this.getData(parentKey);
          delete parentData[subcollectionKey];
          this.editData(parentKey, parentData);
          console.log(`Subcollection '${subcollectionKey}' deleted for parent '${parentKey}'.`);
     }

     showDb() {
          return this.db;
     }

     backupDb(backupFile) {
          try {
               const BACKUP_FILE = path.join(DATABASE_DIR, backupFile);
               fs.copyFileSync(this.filename, BACKUP_FILE);
               logger.info(`Database backed up to ${backupFile}`);
          } catch (err) {
               console.error(`Oops! Unable to back up the database. Check your permissions.`);
               throw err;
          }
     }

     restoreDb(backupFile) {
          try {
               const BACKUP_FILE = path.join(DATABASE_DIR, backupFile);
               fs.copyFileSync(BACKUP_FILE, this.filename);
               this._loadDb();
               logger.info(`Database restored from ${backupFile}`);
          } catch (err) {
               console.error(`Oops! Unable to restore the database. Check your permissions.`);
               throw err;
          }
     }

     _validateWithRegex(key, value) {
          if (this.db._regex && this.db._regex[key]) {
               const regex = new RegExp(this.db._regex[key]);
               if (!regex.test(value)) {
                    throw new Error(`\x1b[31mThe value "${value}" does not match the regex for key "${key}".\x1b[0m`);
               }
          }
     }

     setRegex(key, regexPattern) {
          if (!this.db._regex) {
               this.db._regex = {};
          }
          this.db._regex[key] = regexPattern;
          this._saveDb();
          console.log(`Regex "${regexPattern}" set for key "${key}".`);
     }

     validateData(data) {
          if (typeof data === 'object' && data !== null) {
               for (const [key, value] of Object.entries(data)) {
                    this._validateWithRegex(key, value);
               }
               return true;
          }
          return false;
     }

     convertToDateTime(key) {
          const data = this.getData(key);
          if (data) {
               return utils.convertToDateTime(data);
          } else {
               console.error(`Oops! The key '${key}' does not exist. Unable to convert to datetime.`);
               return null;
          }
     }

     flattenJson(key) {
          const data = this.getData(key);
          if (data) {
               return utils.flattenJSON(data);
          } else {
               console.error(`Oops! The key '${key}' does not exist. Unable to flatten.`);
               return null;
          }
     }

     hashPassword = utils.hashPassword;
     checkPassword = utils.checkPassword;
     getOrDefault = utils.getOrDefault;
     keyExistsOrAdd = utils.keyExistsOrAdd;
     searchData = utils.searchData;
     sanitizeOutput = utils.sanitizeOutput;
     prettyPrint = utils.prettyPrint;
}

module.exports = JsonDB;