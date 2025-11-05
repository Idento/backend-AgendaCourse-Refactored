import { db } from "../lib/allDb.js";

const planningdb = db.main

export function selectAllPlanning() {
    return planningdb.prepare('SELECT * FROM planning').all()
}

export function selectPlanningById(id) {
    return planningdb.prepare('SELECT * FROM planning WHERE id = ?').get(id)
}

export function selectAllPlanningByDriverIdAndDate(driverId, date) {
    return planningdb.prepare('SELECT * FROM planning WHERE driver_id = ? AND date = ?').all(driverId, date)
}

export function selectAllPlanningByRecurrenceAndDate(recurrenceId, date) {
    return planningdb.prepare('SELECT * FROM planning WHERE recurrence_id = ? AND date = ?').all(recurrenceId, date)
}

export function selectOnePlanningByReccurenceId(recurrenceId) {
    return planningdb.prepare('SELECT * FROM planning WHERE recurrence_id = ?').get(recurrenceId)
}

export function selectAllPlanningByRecurrenceId(recurrenceId) {
    return planningdb.prepare('SELECT * FROM planning WHERE recurrence_id = ?').all(recurrenceId)
}

export function selectAllPlanningByDate(date) {
    return planningdb.prepare('SELECT * FROM planning WHERE date = ?').all(date)
}

export function selectAllPlanningInAWeekByDate(allWeekDays) {
    if (typeof allWeekDays !== Array) throw new Error('allWeekDays doit être un tableau')
    return planningdb.prepare('SELECT * FROM planning WHERE date IN (' + allWeekDays.map(() => '?').join(',') + ')').all(allWeekDays)
}

export function selectAllIdAndRecurrenceIDFromPlanning() {
    return planningdb.prepare('SELECT id, recurrence_id FROM planning').all()
}

export function selectPlanningFrequencyWithDate(date) {
    return planningdb.prepare(`SELECT p.*, r.frequency FROM planning p LEFT JOIN recurrence r ON p.recurrence_id = r.id WHERE p.date = ?`).all(date)
}

export function selectPlanningWithRecurrence() {
    return planningdb.prepare(`SELECT * FROM planning WHERE recurrence_id IS NOT NULL AND recurrence_id != 0`).all()
}

export function insertNewPlanningWithoutRecurrence({ driver_id, date, client_name, start_time, return_time, note, destination, long_distance }) {
    const sql = `
    INSERT INTO 
    planning (driver_id,
    date, 
    client_name, 
    start_time, 
    return_time, 
    note, 
    destination,
    long_distance,
    recurrence_id) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    return planningdb.prepare(sql).run(
        driver_id,
        date,
        client_name,
        start_time,
        return_time,
        note,
        destination,
        long_distance,
        0
    )
}

export function insertNewPlanningWithRecurrence({ driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id }) {
    const sql = `
    INSERT INTO 
    planning (driver_id,
    date, 
    client_name, 
    start_time, 
    return_time, 
    note, 
    destination, 
    long_distance, 
    recurrence_id ) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    return planningdb.prepare(sql).run(
        driver_id,
        date,
        client_name,
        start_time,
        return_time,
        note,
        destination,
        long_distance,
        recurrence_id
    )
}

export function insertManyNewPlanningsWithRecurrence(planning) {
    const insertManyPlannings = (plannings) => {
        const stmt = planningdb.prepare(`
        INSERT INTO 
        planning (
        driver_id,
        date, 
        client_name, 
        start_time, 
        return_time, 
        note, 
        destination, 
        long_distance, 
        recurrence_id ) 
        VALUES (@driver_id, @date, @client_name, @start_time, @return_time, @note, @destination, @long_distance, @recurrence_id)`)

        const insertMany = planningdb.transaction((rows) => {
            for (const row of rows) {
                stmt.run(row)
            }
        })
        insertMany(plannings)
    }

    return insertManyPlannings(planning)
}


export function updatePlanningWithId({ driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id, id }) {
    const sql = `
    UPDATE planning 
    SET driver_id = ?, 
    date = ?, 
    client_name = ?, 
    start_time = ?, 
    return_time = ?, 
    note = ?, 
    destination = ?, 
    long_distance = ?, 
    recurrence_id = ? WHERE id = ?`

    return planningdb.prepare(sql).run(
        driver_id,
        date,
        client_name,
        start_time,
        return_time,
        note,
        destination,
        long_distance,
        recurrence_id,
        id
    )
}

export function updatePlanningRecurrenceIdWithId(recurrence_id, id) {
    return planningdb.prepare('UPDATE planning SET recurrence_id = ? WHERE id = ?').run(recurrence_id, id)
}

export function deletePlanningWithId(id) {
    return planningdb.prepare('DELETE FROM planning WHERE id = ?').run(id)
}

export function deletePlanningWithRecurrenceId(recurrence_id) {
    return planningdb.prepare('DELETE FROM planning WHERE recurrence_id = ?').run(recurrence_id)
}

export function deleteManyPlanningWithDateAndReccurenceId(planningToDelete) {
    const deleteManyPlannings = (plannings) => {
        const stmt = planningdb.prepare('DELETE FROM planning WHERE date = @date AND recurrence_id= @recurrence_id')

        const deleteMany = planningdb.transaction((rows) => {
            for (const row of rows) {
                stmt.run(row)
            }
        })
        deleteMany(plannings)
    }

    return deleteManyPlannings(planningToDelete)
}