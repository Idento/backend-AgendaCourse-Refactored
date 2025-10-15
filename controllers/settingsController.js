import Database from "better-sqlite3";
import generatePassword from "../utils/generatePassword.js";
import bcrypt from "bcrypt";
import { db } from "../utils/allDb.js";

export const GetDrivers = function (req, res) {
    const planningDb = db.planning;
    const userdb = db.users;
    let data = [];
    try {
        const driver = planningDb.prepare('SELECT * FROM driver').all();
        driver.map(item => {
            const user = userdb.prepare('SELECT * FROM user WHERE username = ?').get(item.name);
            data.push({ ...item, account: user ? true : false, role: user ? user.role : 'none' });
        });
    } catch (err) {
        console.error('Error while fetching data: ', err);
        res.status(500).send('Internal server error');
        return;
    }
    res.status(200).json(data);
}

export const GetHistoryData = function (req, res) {
    const { date } = req.body;
    const planningDb = db.planning;
    let data;
    let drivers;
    try {
        data = planningDb.prepare('SELECT * FROM planning WHERE date = ?').all(date);
    } catch (err) {
        console.error('Error while fetching data: ', err);
        res.status(500).send('Internal server error');
    }
    try {
        drivers = planningDb.prepare('SELECT * FROM driver').all();
    } catch (err) {
        console.error('Error while fetching drivers: ', err);
        res.status(500).send('Internal server error');
        return;
    }
    res.status(200).json({ data, drivers });
}

export const AddDrivers = async function (req, res) {
    const { name, color, account, role } = req.body;
    const planningDb = db.planning;
    let userdb;
    let randomChar
    if (account) {
        userdb = db.users;
    }
    try {
        planningDb.prepare('INSERT INTO driver (name, color) VALUES (?, ?)').run(name, color);
        if (account) {
            randomChar = generatePassword()
            const password = await bcrypt.hash(randomChar, 10);
            userdb.prepare('INSERT INTO user (username, password, role) VALUES (?, ?, ?)').run(name, password, role);
        }
    } catch (err) {
        console.error('Error while adding driver: ', err);
        res.status(500).send('Internal server error');
        return;
    }
    if (account) {
        res.status(200).send(randomChar);
        return;
    } else {
        res.status(200).send('Driver added');
    }
}

export const AddAccount = async function (req, res) {
    const { name, role } = req.body;
    const userdb = db.users;
    let randomChar = generatePassword();
    const password = await bcrypt.hash(randomChar, 10);

    try {
        userdb.prepare('INSERT INTO user (username, password, role) VALUES (?, ?, ?)').run(name, password, role);
    } catch (err) {
        console.error('Error while adding account: ', err);
        res.status(500).send('Internal server error');
        return;
    }
    res.status(200).send(randomChar);
}



export const ModifyDrivers = async function (req, res) {
    const { id, name, color, account, role } = req.body;
    const planningDb = db.planning;
    const userdb = db.users;
    let user = false;
    let randomChar = false;
    try {
        user = userdb.prepare('SELECT * FROM user WHERE username = ?').get(name);
    } catch (err) {
        user = false;
        console.error('Error while fetching user: ', err);
    }
    if (account && !user) {
        randomChar = generatePassword()
        const password = await bcrypt.hash(randomChar, 10);
        userdb.prepare('INSERT INTO user (username, password, role) VALUES (?, ?, ?)').run(name, password, role);
    } else if (!account && user) {
        userdb.prepare('DELETE FROM user WHERE username = ?').run(name);
    } else if (account && user) {
        userdb.prepare('UPDATE user SET role = ? WHERE username = ?').run(role, name);
    }
    try {
        planningDb.prepare('UPDATE driver SET name = ?, color = ? WHERE id = ?').run(name, color, id);
    } catch (err) {
        console.error('Error while modifying driver: ', err);
        res.status(500).send('Internal server error');
        return;
    }
    if (randomChar.length > 0) {
        res.status(200).json({ message: 'Driver modified', password: randomChar });
        return;
    } else {
        res.status(200).json({ message: 'Driver modified' });
    }
}

export const ModifyAccount = async function (req, res) {
    const { name, role } = req.body;
    const userdb = db.users;
    try {
        userdb.prepare('UPDATE user SET role = ? WHERE username = ?').run(role, name);
    } catch (err) {
        console.error('Error while modifying account: ', err);
        res.status(500).send('Internal server error');
        return;
    }
    res.status(200).send('Account modified');
}

export const DeleteDrivers = function (req, res) {
    const { id } = req.body;
    const planningDb = db.planning;
    try {
        planningDb.prepare('DELETE FROM driver WHERE id = ?').run(id);
    } catch (err) {
        console.error('Error while deleting driver: ', err);
        res.status(500).send('Internal server error');
        return;
    }
    res.status(200).send('Driver deleted');
}

export const DeleteAccount = function (req, res) {
    const { name } = req.body;
    const planningDb = db.planning;
    try {
        planningDb.prepare('DELETE FROM user WHERE username = ?').run(name);
    } catch (err) {
        console.error('Error while deleting account: ', err);
        res.status(500).send('Internal server error');
        return;
    }
    res.status(200).send('Account deleted');
}