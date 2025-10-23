import { db } from "../lib/allDb.js";

const driverdb = db.main

export function getAll() {
    return driverdb.prepare('SELECT * FROM driver').all()
}

export function getDriverByName(name) {
    return driverdb.prepare('SELECT * FROM driver WHERE name=?').get(name)
}

export function insertNewDriver(name, color) {
    return driverdb.prepare('INSERT INTO driver (name, color) VALUES (?, ?)').run(name, color)
}

export function updateDriverById(name, color, id) {
    return driverdb.prepare('UPDATE driver SET name = ?, color = ? WHERE id = ?').run(name, color, id)
}

export function deleteDriverById(id) {
    return driverdb.prepare('DELETE FROM driver WHERE id = ?').run(id)
}