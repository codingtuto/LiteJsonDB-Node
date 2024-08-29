const JsonDB = require('./src/litejsondb');
const fs = require('fs');
const path = require('path');

describe('JsonDB Tests', () => {
    const dbFileName = "testdb";
    const dbPath = path.join('database', dbFileName);

    afterEach(() => {
        // Cleanup: Remove the test database file after each test
        if (fs.existsSync(dbPath)) {
            fs.unlinkSync(dbPath);
        }
    });

    test('should create and retrieve a user from the database', () => {
        const db = new JsonDB(dbFileName);
        db.setData("users/1", {
            firstName: "John",
            lastName: "Doe",
            createdAt: Date.now(),
            email: "example@domain.com"
        });

        const user = db.getData("users/1");
        expect(user).toEqual({
            firstName: "John",
            lastName: "Doe",
            createdAt: expect.any(Number),
            email: "example@domain.com"
        });
    });

    test('should add and retrieve subcollections for a user', () => {
        const db = new JsonDB(dbFileName);
        db.setData("users/1", {
            firstName: "John",
            lastName: "Doe",
            createdAt: Date.now(),
            email: "example@domain.com"
        });

        db.setSubcollection("users/1", "groups", {
            name: "Admins",
            description: "Admin group"
        });

        const user = db.getData("users/1");
        expect(user.groups).toEqual({
            name: "Admins",
            description: "Admin group"
        });
    });

    test('should edit a subcollection', () => {
        const db = new JsonDB(dbFileName);
        db.setData("users/1", {
            firstName: "John",
            lastName: "Doe",
            createdAt: Date.now(),
            email: "example@domain.com"
        });

        db.setSubcollection("users/1", "permissions", {
            canEdit: true,
            canDelete: false
        });

        db.editSubcollection("users/1", "permissions", {
            canDelete: true
        });

        const user = db.getData("users/1");
        expect(user.permissions).toEqual({
            canEdit: true,
            canDelete: true
        });
    });

    test('should encrypt and decrypt data correctly with full process', () => {
        const db = new JsonDB(dbFileName, { encrypt: true });
        const originalData = { message: "Hello, World!" };

        db.setData("messages/1", originalData);
        const retrievedData = db.getData("messages/1");

        expect(retrievedData).toEqual(originalData);
    });

    test('should delete subcollections correctly', () => {
        const db = new JsonDB(dbFileName);
        db.setData("users/1", {
            firstName: "John",
            lastName: "Doe",
            createdAt: Date.now(),
            email: "example@domain.com"
        });

        db.setSubcollection("users/1", "groups", {
            name: "Admins",
            description: "Admin group"
        });

        db.deleteSubcollection("users/1", "groups");

        const user = db.getData("users/1");
        expect(user.groups).toBeUndefined();
    });

    test('should back up and restore the database', () => {
        const db = new JsonDB(dbFileName);
        const backupFileName = "testdb_backup";

        db.setData("users/1", {
            firstName: "John",
            lastName: "Doe",
            createdAt: Date.now(),
            email: "example@domain.com"
        });

        db.backupDb(backupFileName);

        const backupFilePath = path.join('database', backupFileName);
        expect(fs.existsSync(backupFilePath)).toBe(true);

        // Clean the original DB
        fs.unlinkSync(dbPath);

        // Restore from backup
        db.restoreDb(backupFileName);
        const restoredUser = db.getData("users/1");
        expect(restoredUser).toEqual({
            firstName: "John",
            lastName: "Doe",
            createdAt: expect.any(Number),
            email: "example@domain.com"
        });

        // Cleanup backup file
        fs.unlinkSync(backupFilePath);
    });
});
