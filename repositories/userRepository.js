import { db } from "../lib/allDb";

const userDb = db.users

export function selectUserWithUserName(username) {
    return userDb.prepare('SELECT * FROM user WHERE username = ?').get(username)
}

export function selectAllUsernameRole() {
    return userDb.prepare('SELECT username, role FROM user').all()
}

export function insertNewUser(username, password, role) {
    return userDb.prepare('INSERT INTO user (username, password, role) VALUES (?, ?, ?)').run(username, password, role)
}

export function updateUserRoleWithUsername(role, username) {
    return userDb.prepare('UPDATE user SET role = ? WHERE username = ?').run(role, username)
}

export function updateUserPasswordWithUsername(password, username) {
    return userDb.prepare('UPDATE user SET password = ? WHERE username = ?').run(password, username)
}

export function deleteUserWithUsername(username) {
    return userDb.prepare('DELETE FROM user WHERE username = ?').run(username)
}