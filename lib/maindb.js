import Database from "better-sqlite3";
import { db } from "./allDb.js";

export function createTable() {
    db.planning.prepare('CREATE TABLE IF NOT EXISTS driver (id INTEGER PRIMARY KEY, name TEXT, color TEXT)').run();
    db.planning.prepare(`CREATE TABLE IF NOT EXISTS planning (
        id INTEGER PRIMARY KEY, 
        driver_id INTEGER, 
        date TEXT, 
        client_name TEXT, 
        start_time TEXT, 
        return_time TEXT, 
        note TEXT, 
        destination TEXT, 
        long_distance TEXT,
        recurrence_id INTEGER
    )`).run();
    db.planning.prepare(`CREATE TABLE IF NOT EXISTS recurrence (
        id INTEGER PRIMARY KEY, 
        frequency TEXT,
        start_date TEXT,
        next_day TEXT
        )`).run();
    db.planning.prepare(`CREATE TABLE IF NOT EXISTS recurrence_excludedays (
        id INTEGER PRIMARY KEY, 
        recurrence_id INTEGER,
        date TEXT
    )`).run();
    db.planning.prepare(`CREATE TABLE IF NOT EXISTS notes (
        date TEXT PRIMARY KEY,
        note TEXT
    )`).run();
}