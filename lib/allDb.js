import Database from "better-sqlite3";

function openDatabase(filename) {
    try {
        const db = new Database(filename);
        db.pragma('journal_mode = WAL');
        db.pragma('synchronous = NORMAL');
        console.log(`Database ${filename} opened successfully.`);
        return db;
    } catch (error) {
        console.error(`Error opening database ${filename}:`, error);
        throw error;
    }
}

export const db = {
    main: openDatabase("Database.db"),
    archive: openDatabase("archive.db"),
    users: openDatabase("user.db"),
}