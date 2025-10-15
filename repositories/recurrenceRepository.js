import { db } from "../lib/allDb";

const recurrenceDb = db.main

export function selectAll() {
    return recurrenceDb.prepare('SELECT * FROM recurrence').all()
}

export function selectWithId(id) {
    return recurrenceDb.prepare('SELECT * FROM recurrence WHERE id = ?').get(id)
}

export function selectFrequencyRecurrenceWithId(id) {
    return recurrenceDb.prepare('SELECT frequency FROM recurrence WHERE id = ?').get(id)
}

export function insertRecurrence(frequency, start_date, next_day) {
    return recurrenceDb.prepare('INSERT INTO recurrence (frequency, start_date, next_day) VALUES (?, ?, ?)').run(frequency, start_date, next_day)
}

export function updateReccurenceDaysWithId(start_date, next_day, id) {
    return recurrenceDb.prepare('UPDATE recurrence SET start_date = ?, next_day = ? WHERE id = ?').run(start_date, next_day, id)
}

export function updateRecurrenceWithId(frequency, start_date, next_day, id) {
    return recurrenceDb.prepare('UPDATE recurrence SET frequency = ?, start_date = ?, next_day = ? WHERE id = ?').run(frequency, start_date, next_day, id)
}

export function updateFrequencyAndNextDayWithId(frequency, next_day, id) {
    return recurrenceDb.prepare('UPDATE recurrence SET frequency = ?, next_day = ? WHERE id = ?').run(frequency, next_day, id)
}

export function deleteRecurrenceWithId(id) {
    return recurrenceDb.prepare('DELETE FROM recurrence WHERE id = ?').run(id)
}