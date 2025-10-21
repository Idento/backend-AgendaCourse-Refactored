import { db } from "../lib/allDb.js";

const notedb = db.main

export function selectNoteWithDate(date) {
    return notedb.prepare('SELECT * FROM notes WHERE date = ?').get(date)
}

export function insertNote(date, note) {
    return notedb.prepare('INSERT INTO notes (date, note) VALUES (?, ?)').run(date, note)
}

export function updateNoteWithDate(date, note) {
    return notedb.prepare('UPDATE notes SET note = ? WHERE date = ?').run(note, date)
}