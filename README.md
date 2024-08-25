# 📚 LiteJsonDB Documentation

**LiteJsonDB** is a lightweight local JSON database for Node.js, designed to simplify JSON data management in your projects. This package is a fork of the Python [LiteJsonDB](https://github.com/codingtuto/LiteJsonDb/) project, adapted for Node.js. Currently, this project is about 45% complete, meaning it's already super functional but still has room for more cool features.
> LiteJsonDB is like a nifty little vault for your JSON data. It provides a simple and intuitive API for adding, modifying, retrieving, and deleting data. You don't need to worry about the complexities of heavier database systems. With LiteJsonDB, you can focus on what really matters: your data.

## 🔧 Installation

To get started with LiteJsonDB, you need to install it via npm. It's super easy! Just run the following command in your terminal:

<pre>
npm install litejsondb
</pre>

## 🎯 Usage

### 🏁 Initialization

Once installed, you can import LiteJsonDB and initialize your database like this:

<pre>
const litejsondb = require('litejsondb');
const db = new litejsondb();
</pre>

### 📥 Adding Data

Adding data is a breeze with LiteJsonDB. Use the `setData` method to store information in the database:

<pre>
db.setData('users/1', { name: 'Aliou', age: 30 });
db.setData('products/1', { name: 'Laptop', price: 999.99 });
</pre>

### 🔄 Editing Data

To update existing data, use `editData`. You can modify information without erasing what’s already there:

<pre>
db.editData('users/1', { age: 31 });
</pre>

### 📜 Getting Data

The `getData` method allows you to retrieve data from the database. You can specify the exact path of the data you want to access. Here’s how you can use it:

<pre>
console.log('User 1:', db.getData('users/1'));
console.log('Product 1:', db.getData('products/1'));
</pre>

**Explanation**:
- **Path Specification**: You use a key path like `'users/1'` or `'products/1'` to retrieve specific entries from the database. The key path is a string that denotes the location of the data in the hierarchical structure of the database.
- **Default Behavior**: If the specified path does not exist, `getData` may return `undefined`. Ensure you handle such cases in your code to avoid errors.

### ❌ Deleting Data

Need to delete data? No problem! The `deleteData` method allows you to remove specific information. You have two options:

1. **Delete Specific Entry**: If you want to delete a specific entry, provide the exact key path:
   
   <pre>
   db.deleteData('products/1');
   </pre>

   This command will remove only the data located at `'products/1'`, leaving other data intact.

2. **Delete All Data Under a Path**: If you want to delete all data under a specific key path, you can use a nested key path:

   <pre>
   db.deleteData('products');
   </pre>

   This will remove the entire `'products'` section, including all entries within it, such as `'products/1'` and any other nested products. 

**Explanation**:
- **Specific Entry Deletion**: By providing a precise path like `'products/1'`, you delete only that particular entry.
- **Path-Wide Deletion**: Using a broader path like `'products'` deletes everything under that path. This is useful for clearing out all related data but should be used carefully to avoid unintentional data loss.

### 🔍 Searching Data

You can also search your data with `searchData`. This helps you find specific values anywhere in the database:

<pre>
const searchResults = db.searchData(db.getData(), 'Aliou');
console.log(searchResults);
</pre>

### 🛠️ Utility Functions

LiteJsonDB includes some handy utility functions:

- **hashPassword(password)**: Hashes the given password.
- **checkPassword(storedHash, password)**: Checks if the password matches the stored hash.
- **getOrDefault(data, key, defaultValue)**: Returns the value for the key or a default value if the key doesn’t exist.
- **keyExistsOrAdd(data, key, defaultValue)**: Checks if the key exists and adds it with a default value if not.

Here’s how you can use them:

<pre>
const hashedPassword = db.hashPassword('myPassword123');
const isPasswordValid = db.checkPassword(hashedPassword, 'myPassword123');
const defaultValue = db.getOrDefault(testObj, 'country', 'Unknown');
const keyExists = db.keyExistsOrAdd(testObj, 'country', 'Unknown');
</pre>

## 📖 Example Code

Here’s a small example to show you how everything works together:

<pre>
const litejsondb = require('litejsondb');
const db = new litejsondb();

// Set initial data
db.setData('users/1', { name: 'Aliou', age: 30 });
db.setData('products/1', { name: 'Laptop', price: 999.99 });

// Edit data
db.editData('users/1', { age: 31 });

// Get data
console.log('User 1:', db.getData('users/1'));
console.log('Product 1:', db.getData('products/1'));

// Delete Data
db.deleteData('products/1');

// Show the entire database content
console.log('Database Content:', db.showDb());
</pre>

## 🛠️ Future Development

**LiteJsonDB** is a fork of our Python [LiteJsonDB](https://github.com/codingtuto/LiteJsonDb/) package. I’ve managed to reproduce about 45% of the work so far, and it's already functional with features like adding, editing, and deleting data. However, there’s still a lot to be done! 

If you have skills in both Node.js and Python, you might want to dive into the code and contribute to the Node.js project. Currently, I’m focused more on Python development and may not have enough time to add all the desired features to this package.

Your contributions could help move the project forward and make it even better. Feel free to explore the code and get involved!

## 💬 Contribution

If you want to contribute to the project, feel free to open issues or pull requests. Every contribution is welcome to help make this project even better!

---
