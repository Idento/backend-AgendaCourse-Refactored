import Database from "better-sqlite3";
import { db } from "./allDb.js";

export function createSavedTable() {
    db.archive.prepare(`CREATE TABLE IF NOT EXISTS saved_planning (
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
}