# 📚 LiteJsonDB Documentation

## 🚀 Introduction

**LiteJsonDB** is a lightweight local JSON database for Node.js, designed to simplify JSON data management in your projects. This package is a fork of the Python LiteJsonDB project, adapted for Node.js. Currently, this project is about 45% complete, meaning it's already super functional but still has room for more cool features.

### 📝 Description

LiteJsonDB is like a nifty little vault for your JSON data. It provides a simple and intuitive API for adding, modifying, retrieving, and deleting data. You don't need to worry about the complexities of heavier database systems. With LiteJsonDB, you can focus on what really matters: your data.

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
db.setData('users/1', { name: 'John Doe', age: 30 });
db.setData('products/1', { name: 'Laptop', price: 999.99 });
</pre>

### 🔄 Editing Data

To update existing data, use `editData`. You can modify information without erasing what’s already there:

<pre>
db.editData('users/1', { age: 31 });
</pre>

### ❌ Deleting Data

Need to delete data? No problem! The `deleteData` method allows you to remove specific information:

<pre>
db.deleteData('products/1');
</pre>

### 🔍 Searching Data

You can also search your data with `searchData`. This helps you find specific values anywhere in the database:

<pre>
const searchResults = db.searchData(db.getData(), 'John Doe');
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

// Add users and products
db.setData('users/1', { name: 'John Doe', age: 30 });
db.setData('products/1', { name: 'Laptop', price: 999.99 });

// Edit a user
db.editData('users/1', { age: 31 });

// Delete a product
db.deleteData('products/1');

// Show the entire database content
console.log('Database Content:', db.showDb());
</pre>

## 🛠️ Future Development

**LiteJsonDB** is a fork of our Python LiteJsonDB package. I’ve managed to reproduce about 45% of the work so far, and it's already functional with features like adding, editing, and deleting data. However, there’s still a lot to be done! 

If you have skills in both Node.js and Python, you might want to dive into the code and contribute to the Node.js project. Currently, I’m focused more on Python development and may not have enough time to add all the desired features to this package.

Your contributions could help move the project forward and make it even better. Feel free to explore the code and get involved!


## 💬 Contribution

If you want to contribute to the project, feel free to open issues or pull requests. Every contribution is welcome to help make this project even better!

---
