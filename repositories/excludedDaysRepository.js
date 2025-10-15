import { db } from "../lib/allDb";

const excludedDb = db.main

export function selectAll() {
    return excludedDb.prepare('SELECT * FROM recurrence_excludedays').all()
}

export function selectExcludedWithRecurrenceId(recurrence_id) {
    return excludedDb.prepare('SELECT * FROM recurrence_excludedays WHERE recurrence_id = ?').get(recurrence_id)
}

export function insertExcluded(recurrence_id, date) {
    return excludedDb.prepare('INSERT INTO recurrence_excludedays (recurrence_id, date) VALUES (?, ?)').run(recurrence_id, date)
}

export function updateExcludedDateWithRecurrenceId(recurrence_id, date) {
    return excludedDb.prepare('UPDATE recurrence_excludedays SET date = ? WHERE recurrence_id = ?').run(recurrence_id, date)
}

export function deleteExcludedWithReccurenceId(recurrence_id) {
    return excludedDb.prepare('DELETE FROM recurrence_excludedays WHERE recurrence_id = ?').run(recurrence_id)
}