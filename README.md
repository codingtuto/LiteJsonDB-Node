# LiteJsonDB 🚀 — Lightweight & Powerful JSON Database for Node.js

**A blazing-fast, zero-dependency, and plugin-friendly JSON database. LiteJsonDB is designed for simplicity, extensibility, and power — all managed within a single file.**

LiteJsonDB is a modular, local-first database for Node.js. It stores deeply nested JSON data in a file and supports subscriptions, key locking, AES-256 encryption, migrations, schema validation, snapshots, and custom plugins — all without any external dependencies.

---

## 🧱 How the architecture works — Nested Path-Based JSON

LiteJsonDB uses **nested key paths** to manipulate JSON structures. Instead of passing full objects, you operate on any depth using slash-separated keys, making your code clean and intuitive.

```js
// This single line...
db.set("users/1/profile/email", "dev@example.com");

// ...creates this structure automatically:
{
  "users": {
    "1": {
      "profile": {
        "email": "dev@example.com"
      }
    }
  }
}
```

Every read, write, and update operation is performed through these key paths. This keeps your code concise, and the internal cache makes even deep queries incredibly fast.

---

## 🌟 Why LiteJsonDB?

- ✅ **Zero Setup**: No servers, no external tools. It's just a JSON file.
- ⚡ **Ultra-Fast**: An intelligent LRU cache for instant reads and debounced writes to minimize disk I/O.
- 🔐 **AES-256 Encryption**: Secure sensitive data on a per-key basis.
- 🔄 **Safe Syncing**: Writes are handled automatically, but you can force an immediate save with `saveNow()`.
- 🧩 **Pluggable**: A flexible plugin system lets you add only the features you need.
- 🧠 **Clear Control**: Human-readable logs and fine-grained access control give you full command.

---

## 🚨 v2.0 — Breaking Changes & Redesign

LiteJsonDB 2.0 is a complete rewrite for better speed, clarity, and modularity.

> ⚠️ This update **requires refactoring your codebase**. We apologize for the disruption, but it was a necessary step to make the database simpler, safer, and much faster.

> You can choose to stay on v1.x (1.0.5) for compatibility. However, we strongly recommend migrating to benefit from the performance and architectural improvements.

### 🧹 Deprecated in v2.0
- ❌ **Subcollections**: Removed due to performance and complexity issues.
- ❌ **Built-in code-less plugins**: Replaced with a more explicit and powerful plugin architecture.
- ❌ **Global encryption mode**: Replaced by fast, per-key AES-256 encryption.
- ❌ **`setData()` / `getData()`....**: Now simplified to `set()` and `get()`.

### 🔁 Comparison Table: v1.x vs v2.0
| Feature                    | v1.x                             | v2.0.0 (current)                 |
|----------------------------|----------------------------------|----------------------------------|
| `setData()` / `getData()`  | ✅ Verbose                        | ✅ Replaced by `set()` / `get()` |
| Global encryption          | ✅ Yes                            | ✅ Per-key AES-256 only          |
| Subcollections             | ✅ Nested APIs                    | ❌ Removed                       |
| Built-in auto-plugins      | ✅ Implicit & hidden              | ❌ Removed                       |
| Plugin system              | ⚠️ Limited                       | ✅ Full `activate()` architecture|
| Nested path access         | ✅ OK                             | ✅ Improved + LRU cache          |
| `search()` method          | ✅ Included                       | ❌ Removed — use `query()`       |
| `merge()` method           | ✅ Used for updates               | ✅ Renamed to `edit()`           |
| Snapshot support           | ❌ None                           | ✅ `saveSnapshot()` and restore  |
| Overall performance        | ⚠️ Acceptable                    | ✅ Much faster & optimized       |

---

## 🛠 Installation

Install the package using npm.

```bash
npm install litejsondb
```

---

## 🚀 Initialization

Import the class, create a new instance, and you're ready to go.

```js
const LiteJsonDB = require('litejsondb');

const db = new LiteJsonDB({
  filename: 'main.json', // The file name where your data will be stored.
  enableLog: true        // Set to true to print helpful debug logs to the console.
 // 💡Refer to fine-tuning section for other parameters....
});
```
- **`filename`**: The name of your database file. It will be created inside a `database/` directory by default.
- **`enableLog`**: Prints detailed logs for operations, warnings, and errors. Highly recommended during development. 
- The database file and its parent directory are created automatically if they don't exist.

---

## 🔧 Core CRUD Operations

These are the fundamental methods for interacting with your data.

### `set(key, value)` — Create data (CREATE)
> **What it does**: Sets a value at a specified path. If the parent objects in the path do not exist, they will be created automatically.

```js
// Store a simple string value at a nested path.
db.set('settings/ui/theme', 'dark');

// Store a complex object. This will overwrite any existing data at 'users/1'.
db.set('users/1', { name: 'Alice', role: 'admin' });
```
- **`key` (string)**: The slash-separated path where the data will be stored.
- **`value` (any)**: The data to store (string, number, boolean, object, array).
- **Behavior**: This is a destructive operation. If a value already exists at the key, it will be silently use the edit() method with warning.

---

### `get(key)` — Retrieve data (READ)
> **What it does**: Reads the value from a specified path. Returns `null` if the key is not found.

```js
// Retrieve the theme setting.
const theme = db.get('settings/ui/theme'); // Returns 'dark'

// Attempt to get data from a key that doesn't exist.
const nonExistent = db.get('settings/server/ip'); // Returns null
```
- **Performance**: This operation is extremely fast due to an internal LRU cache that stores recently accessed values.

---

### `has(key)` — Check for existence
> **What it does**: Returns `true` if a key exists and has a non-null value, and `false` otherwise. Use this to safely check for data before reading or writing.

```js
// Check if a user entry exists before trying to access it.
if (db.has('users/1')) {
  console.log('User 1 exists!');
} else {
  console.log('User 1 not found.');
}
```

---

### `edit(key, object)` — Merge into an existing object (UPDATE)
> **What it does**: Updates an existing object by merging new properties into it. This is the perfect tool for partial updates. Note: This is any alias for  `merge()`.

```js
// Let's assume 'users/1' already contains { name: 'Alice', role: 'admin' }.

db.edit('users/1', { role: 'super-admin', lastLogin: Date.now() });

// The final object is now:
// { name: 'Alice', role: 'super-admin', lastLogin: ... }
```
- **Behavior**: It only works if the target at `key` is an object. It will fail and return `false` if the target is a string, number, or array. New keys are added, and existing keys are overwritten.

---

### `increment(key, step = 1)` — Add to a number
> **What it does**: Atomically increments a numeric value. If the key does not exist, it will be created with the `step` value.

```js
// Track page visits.
db.increment('stats/visits'); // The value is now 1.
db.increment('stats/visits'); // The value is now 2.

// Increment by a custom amount.
db.increment('stats/visits', 10); // The value is now 12.
```
- **`step` (number, optional)**: The amount to add. Defaults to `1`.

---

### `delete(key)` — Remove data (DELETE)
> **What it does**: Removes a key and its associated value from the database.

```js
// Delete a specific setting. (Specific path)
db.delete('settings/ui/theme');

// Delete an entire object and all its children.
db.delete('users');
```
- **Safety**: This operation is safe. If the key does not exist, it does nothing and returns `false`.

---

### `saveNow()` — Force a synchronous save
> **What it does**: Immediately writes all current data from memory to the disk. (Refer to "Fine-tuning section to learn more about it)

```js
db.set('app/shutdown_reason', 'manual_restart');

// Ensure all data is saved before the application exits.
db.saveNow();
```
- **Use Case**: By default, LiteJsonDB waits a short moment (`debounceMS`) before writing to disk to batch multiple changes. Use `saveNow()` when you need to guarantee that the data is persisted immediately.

---

## 🧠 Advanced Capabilities

Go beyond simple CRUD with these powerful built-in features.

### `readonly(true|false)` — Lock the entire database
> **What it does**: Toggles a global read-only mode, preventing all write operations (`set`, `edit`, `delete`, `increment`).

```js
db.readonly(true); // Database is now in read-only mode.
db.set('test', 'this will fail'); // Returns false and logs a warning.
db.readonly(false); // Re-enable writes.
```

### `lock(key)` / `unlock(key)` — Lock an individual Key
> **What it does**: Prevents any write operations on a specific key, protecting critical data from accidental changes.

```js
db.lock('users/1/apiKey');
db.edit('users/1', { apiKey: 'new-key' }); // This part of the edit will be ignored.
db.unlock('users/1/apiKey');
```

### `query(baseKey, filterFn)` — Filter child entries
> **What it does**: Searches through the direct children of an object at `baseKey` and returns an array of entries that match the filter function. [LIKE AS SQL OPERATION]

```js
db.set('users', {
  u1: { role: 'admin', active: true },
  u2: { role: 'user', active: false },
  u3: { role: 'admin', active: false },
});

// Find all users who are admins.
const admins = db.query('users', (user) => user.role === 'admin');
// Returns: [{ path: 'users/u1', value: { ... } }, { path: 'users/u3', value: { ... } }]
```
- **`filterFn(value, key)`**: A function that receives the child's `value` and `key` and should return `true` if it's a match.

### `subscribe(key, callback)` — Listen for live updates
> **What it does**: Attaches a listener to a key. The `callback` function is triggered every time the value at that key is changed.

```js
db.subscribe('game/score', (newScore) => {
  console.log(`Score updated! New score: ${newScore}`);
});

db.set('game/score', 100); // Logs: "Score updated! New score: 100"
```

### `migrate(transformFn)` — Run database transformations
> **What it does**: Provides a safe way to apply structural changes to your entire database. The migration is atomic and saves automatically upon success.

```js
// Example: Add a 'createdAt' timestamp to all existing users.
db.migrate(dbInstance => {
  const users = dbInstance.get('users');
  for (const id in users) {
    dbInstance.edit(`users/${id}`, { createdAt: Date.now() });
  }
});
```

### `encrypt(key, password)` / `decrypt(key, password)`
> **What it does**: Encrypts or decrypts the value at a specific key using AES-256.

```js
// Encrypt a sensitive token.
db.encrypt('secrets/apiToken', 'a-very-strong-password');
// The value at 'secrets/apiToken' is now an encrypted string.

// Decrypt it back to its original form.
const token = db.decrypt('secrets/apiToken', 'a-very-strong-password');
```

---

## 🔌 Plugin System

Extend LiteJsonDB's functionality with custom or built-in plugins.

### Activating Plugins
To activate plugins, pass them to the `db.activate()` method. You can access the built-in plugins via `db.pluginPacks`.

```js
const db = new LiteJsonDB();

// Activate multiple plugins at once.
db.activate(
  db.pluginPacks.AutoBackupPlugin,
  db.pluginPacks.ChangeLoggerPlugin
);
```

### Built-in Plugins
| Plugin                | Description                                                          |
|-----------------------|----------------------------------------------------------------------|
| `AutoBackupPlugin`    | Automatically saves a timestamped snapshot of the DB after every write. |
| `ChangeLoggerPlugin`  | Logs all `set` and `delete` operations to the console for easy debugging. |
| `AutoCastPlugin`      | Automatically converts string values like `"123"` or `"true"` to their proper types. |
| `ExpiryPlugin`        | Adds a `db.expire(key, ms)` method to auto-delete keys after a timeout. |
| `SchemaValidatorPlugin`| Adds `db.defineSchema()` to validate objects against a structure before saving. |

---

### 🔮 Creating Custom Plugins
> The true power of LiteJsonDB v2.x lies in its robust hook-based plugin system. You can create your own plugins to extend, modify, or observe any database operation. This architecture is far more powerful and performant than the implicit plugin system of v1.x, which offered limited control.

A plugin is simply a function that accepts the database instance (`db`) as its first argument. Inside this function, you can attach listeners (hooks) to various events in the database's lifecycle.

#### How it Works: The `db.on(hookName, callback)` Method
You can hook into the lifecycle of core operations. There are "before" hooks, which run before an action is executed, and "after" hooks, which run after it has completed.

Here is a simple logger plugin:
```javascript
/**
 * A custom plugin that logs every successful write operation.
 * @param {LiteJsonDB} db - The database instance.
 */
function WriteLoggerPlugin(db) {
  // The 'afterSet' hook runs immediately after a value has been successfully set.
  db.on('afterSet', (key, value) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] WRITE: Key '${key}' was set to`, value);
  });

  // The 'afterDelete' hook runs after a key has been successfully deleted.
  db.on('afterDelete', (key) => {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] DELETE: Key '${key}' was removed.`);
  });
}

// Activate your custom plugin using db.use() or db.activate()
db.use(WriteLoggerPlugin);
```

#### Available Hooks
You have access to the complete operational lifecycle:

| Hook Name        | Triggered...                                                 | Callback Arguments        | Special Behavior                                                                                                              |
| ---------------- | ------------------------------------------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `beforeSet`      | Before a value is written with `set()`.                      | `(key, value)`            | **Can modify data**. Return a new value from the callback to change what gets saved. Throw an error to cancel the operation. |
| `afterSet`       | After a value has been successfully written.                 | `(key, value)`            | Ideal for logging, notifications, or triggering side-effects.                                                                 |
| `beforeDelete`   | Before a key is deleted with `delete()`.                     | `(key)`                   | Throw an error to prevent the deletion.                                                                                       |
| `afterDelete`    | After a key has been successfully deleted.                   | `(key)`                   | Perfect for cleanup tasks or logging.                                                                                         |

#### Advanced Example: A Data Validation and Transformation Plugin

Let's create a plugin that does two things:
1.  Ensures that any data set under `users/` has a `name` property.
2.  Automatically adds a `createdAt` timestamp to new user objects.

```javascript
function UserEnhancerPlugin(db) {
  db.on('beforeSet', (key, value) => {
    // We only care about keys that start with 'users/'.
    if (!key.startsWith('users/')) {
      return; // IMPORTANT: Do nothing for other keys.
    }

    // 1. Validation: Ensure the value is an object with a name.
    if (typeof value !== 'object' || !value.name) {
      // Cancel the operation by throwing an error.
      throw new Error("User object must include a 'name' property.");
    }

    // 2. Transformation: Add a timestamp if it's a new user.
    // We check if the key already exists to avoid overwriting the timestamp on edits.
    if (!db.has(key)) {
      value.createdAt = new Date().toISOString();
    }
    
    // Return the modified value to be saved.
    return value;
  });
}

// Activate the plugin
db.use(UserEnhancerPlugin);

// This will fail and throw an error.
// db.set('users/1', { email: 'test@example.com' }); 

// This will succeed and add the `createdAt` timestamp automatically.
db.set('users/2', { name: 'Alice' }); 
// Saved data: { name: 'Alice', createdAt: '...' }
```

#### Why v2.0's Plugin System is a Major Leap Forward

In v1.x, plugins were implicit and "magical." You couldn't easily create your own, and their behavior was not transparent. The new hook-based system in v2.0 provides critical advantages:

1.  **Granular Control**: With `before` and `after` hooks for each core action, you have precise control over the entire data lifecycle. You can inspect, validate, modify, or cancel operations at will. This was impossible in v1.x.
2.  **Performance**: Hooks are direct function calls within the operation's flow. They are lightweight and add minimal overhead. In contrast, the old system often required extra read/write cycles, making it less efficient.
3.  **Clarity and Debuggability**: Your code explicitly states what it's doing. When a `beforeSet` hook modifies data, it's clear where the transformation happens, making debugging straightforward. The "magic" of v1.x is gone, replaced by predictable, traceable logic.
4.  **Extensibility**: You are no longer limited to a small, predefined set of features. The hook system opens the door to infinite possibilities: create advanced validation layers, data sanitization pipelines, real-time data replication triggers, or integrate with external services—all through a clean and consistent API.

---

## ✅ Full Example

Here is a complete example demonstrating how various features work together.

```js
const LiteJsonDB = require('litejsondb');

const db = new LiteJsonDB({ filename: 'game_data.json', enableLog: true });

// Activate a plugin to automatically cast string inputs.
db.activate(db.pluginPacks.AutoCastPlugin);

// Set initial player data.
db.set('players/p1', { name: 'Zelda', hp: 100 });

// The player takes damage. `edit` is perfect for this.
db.edit('players/p1', { hp: 95 });

// Use `increment` to track hits.
db.increment('players/p1/hits'); // The value is now 1.

// Lock the player's name to prevent changes.
db.lock('players/p1/name');
db.edit('players/p1', { name: 'Princess Zelda' }); // The name change will be blocked.

// Subscribe to HP changes to trigger UI updates.
db.subscribe('players/p1/hp', (newHp) => {
  console.log(`Zelda's HP is now ${newHp}!`);
});

db.set('players/p1/hp', 80); // Triggers the subscription log.

console.log('Final player data:', db.get('players/p1'));

// Final player data: { name: 'Zelda', hp: 80, hits: 1 }
```

---

### ⚙️ Fine-Tuning & Performance

LiteJsonDB is designed to be fast out-of-the-box, but you can fine-tune its behavior to match the specific needs of your application. Understanding these configuration options will help you optimize for speed, data safety, and resource usage.

You can pass these options during initialization:
```javascript
const db = new LiteJsonDB({
  filename: 'app_data.json',
  dbDir: './data/production', // Custom directory
  debounceMS: 500,            // Custom debounce delay
  enableLog: false,           // Disable logs for performance
  enableSave: true            // Keep saving enabled
});
```

Here’s a deep dive into each performance-related setting.

#### 1. Customizing the Save Delay (`debounceMS`)

**What it is**: `debounceMS` is the delay in milliseconds that LiteJsonDB waits after the *last* write operation before saving the data to disk.

**Default**: `200` (ms)

**Why it matters**: This "debouncing" mechanism is a major performance feature. Instead of writing to the disk every single time you call `set()`, `edit()`, or `delete()`, LiteJsonDB groups multiple changes into a single file write.

*   **Low `debounceMS` (e.g., `50`)**:
    *   **Pros**: Higher data integrity. Changes are saved to disk more quickly, reducing the risk of data loss if the application crashes.
    *   **Cons**: More frequent disk I/O, which can slightly reduce performance if your application performs many writes in rapid succession.
    *   **Use Case**: When storing critical data where every operation must be persisted as soon as possible.

*   **High `debounceMS` (e.g., `1000`)**:
    *   **Pros**: Better performance for write-heavy applications. More operations are batched into a single, efficient disk write.
    *   **Cons**: Higher risk of data loss for changes made within that 1-second window before a crash.
    *   **Use Case**: Bulk data imports, batch processing, or scenarios where performance is more critical than the immediate persistence of every single change.

#### 2. Specifying a Custom Data Folder (`dbDir`)

**What it is**: `dbDir` allows you to specify the directory where the database file will be stored.

**Default**: `'database'`

**Why it matters**:
*   **Project Organization**: It helps you keep your project structure clean. You can separate your database files from your source code, logs, or other assets. For example, you might use `./.data` to hide it or `/var/data/my-app` in a production Linux environment.
*   **Environment Management**: You can easily point to different directories for different environments (development, testing, production).

```javascript
// Store test data in a temporary directory
const db = new LiteJsonDB({
  dbDir: '/tmp/my-app-tests'
});
```
> **Note**: The directory will be created automatically if it doesn't exist.

#### 3. Disabling Logs for Production (`enableLog`)

**What it is**: `enableLog` controls whether LiteJsonDB prints detailed operational logs (like `[Info]`, `[Notice]`) to the console.

**Default**: `false`

**Why you should disable it in production**:
*   **Performance**: While `console.log` seems harmless, frequent calls in a high-traffic application can create a bottleneck and slow down your event loop. In production, every millisecond counts.
*   **Security & Cleanliness**: It prevents sensitive data from being accidentally logged in a production environment. It also keeps your production server logs clean and focused on critical errors or application-specific output.

**Recommendation**:
*   **During Development (`enableLog: true`)**: Keep logs enabled. They provide invaluable insight into what the database is doing, making debugging much easier.
*   **In Production (`enableLog: false`)** : Always disable logs to maximize performance and security. Critical warnings and errors will still be printed to `console.warn` and `console.error`.

#### 4. Disabling Auto-Saving (`enableSave`)

**What it is**: `enableSave` is a powerful switch that completely disables all automatic and manual writes to the disk.

**Default**: `true`

**Why it exists**:
This option effectively turns LiteJsonDB into a **temporary, in-memory data store**. The database will still be loaded from the file on startup, but any changes made during the application's runtime will **not** be saved.

*   **Use Cases**:
    *   **Unit Testing**: When you want to test logic without creating or modifying files on disk.
    *   **"Dry Run" Mode**: For applications that have a "preview" or "dry run" mode, where you want to simulate operations without making permanent changes.
    *   **High-Performance Caching**: When you only need a fast, in-memory key-value store for the duration of a single script, and don't need the data to persist.

```javascript
const db = new LiteJsonDB({
  enableSave: false // The database now acts as a temporary in-memory object
});

db.set('temp/data', 'this will be lost when the app closes');
// No file writes will ever occur.
```
> **Warning**: When `enableSave` is `false`, even calling `db.saveNow()` will do nothing. Use this option with care.

---

## 🤝 Contribute
Have a bug to report or an idea for a new feature? We welcome contributions! Please read our guide on how to contribute to this project.

---

MIT License — Built with ❤️ for developers who love fast, flexible, and fun local storage solutions.