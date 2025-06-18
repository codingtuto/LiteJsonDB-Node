## [2.2.0] - 2025-19-06
Fix error `Cannot find module`

---

## [2.0.0] - 2025-18-06

### 💥 BREAKING CHANGES

This version is a complete architectural overhaul of LiteJsonDB, focusing on performance, modularity, and developer experience. Migrating from v1.x will require code changes.

- **Simplified API**: `setData()` and `getData()` have been removed in favor of the more intuitive `set()` and `get()`.
- **Removed Subcollections**: The concept of subcollections has been removed to simplify the API and improve performance. All data access is now done via nested key paths (e.g., `users/1/profile`).
- **Explicit Plugins**: All features beyond the core CRUD operations are now handled by a robust, explicit plugin system. Auto-activating "magic" plugins are gone.
- **Per-Key Encryption**: Global encryption has been replaced with a more secure and flexible per-key `encrypt()` and `decrypt()` method using AES-256.
- **Renamed `merge()`**: The `merge()` method has been renamed to `edit()` for clarity.

### ✨ Added

- **New Core Engine**: A rewritten core engine featuring an **LRU Cache** for instant reads and **Debounced Writes** for efficient disk I/O.
- **Robust Plugin System**: A powerful `db.activate()` method and a hook-based architecture (`on()`) allow for deep customization.
- **Full Feature Set as Standard**:
  - `readonly()`: A global mode to prevent all database writes.
  - `lock(key)` / `unlock(key)`: Lock individual keys from modification.
  - `query(baseKey, filterFn)`: A simple but powerful method to filter object children.
  - `subscribe(key, callback)`: Listen for real-time changes to a specific key.
  - `migrate(transformFn)`: A safe way to apply structural changes to the database.
- **New Built-in Plugin Pack**:
  - `AutoBackupPlugin`: Creates timestamped backups on every write.
  - `ChangeLoggerPlugin`: Logs all data changes for easy debugging.
  - `AutoCastPlugin`: Converts strings to their proper types (number, boolean, etc.).
  - `ExpiryPlugin`: Adds a `db.expire(key, ms)` method for self-deleting keys.
  - `SchemaValidatorPlugin`: Enforces a defined structure for your objects.
- **Configuration Options**:
  - `debounceMS`: Customize the delay before data is saved to disk.
  - `dbDir`: Specify a custom directory for your database file.
  - `enableSave`: A new option to run the DB in a temporary, in-memory mode without saving.

### ♻️ Changed

- **Performance**: Significantly faster read and write operations due to the new architecture.
- **Logging**: Improved, colorful, and more descriptive console logs (which can be disabled in production for performance).
- **Modularity**: The codebase is now cleanly separated into `core`, `features`, `plugins`, and `utils` for better maintainability.

### 🗑️ Removed

- **Subcollections**: The `collection()` and `subcollection()` methods have been removed.
- **`search()` Method**: The global `search()` has been removed in favor of the more targeted and performant `query()` method.
- **Implicit Plugins**: No features are activated implicitly anymore. Everything is either built-in or activated manually.

### 🐞 Fixed

- **Infinite Loops**: Fixed a critical bug where certain plugins (like the old auto-caster) could cause an infinite loop by calling `set` from within a `set` hook. The new hook system prevents this by design.
- **Error Handling**: Improved error handling and more descriptive warning messages across the board.