import Database from "better-sqlite3";
import generatePassword from "../utils/generatePassword.js";
import bcrypt from "bcrypt";
import { db } from "./allDb.js";


export async function createUserTable() {
    db.users.prepare(`CREATE TABLE IF NOT EXISTS user (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role TEXT DEFAULT 'utilisateur'
        )`).run();
    const user = db.users.prepare('SELECT * FROM user WHERE username = ?').get('admin');
    let password;
    if (!user) {
        password = generatePassword();
        const hashedPassword = await bcrypt.hash(password, 10);
        db.users.prepare('INSERT INTO user (username, password, role) VALUES (?, ?, ?)').run('admin', hashedPassword, 'administrateur');
        console.log(password);
    }
}