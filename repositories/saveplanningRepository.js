import { db } from '../lib/allDb'

const saveDB = db.archive

export function insertSavePlanning({ id, driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id }) {
    const sql = `
    INSERT INTO saved_planning (
    id, 
    driver_id, 
    date, 
    client_name, 
    start_time, 
    return_time, 
    note, 
    destination, 
    long_distance, 
    recurrence_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

    return saveDB.prepare(sql).run(
        id,
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