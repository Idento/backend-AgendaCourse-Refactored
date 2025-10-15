import Database from "better-sqlite3";
import generatePassword from "../utils/generatePassword.js";
import bcrypt from "bcrypt";
import { db } from "../utils/allDb.js";

/**
 * @route   GET parametres/get
 * @desc    Récupère tous les utilisateurs, chauffeur comme utilisateur classique.
 * @output  [
 *              {driver_id:5, ...user},
 *              {driver_id:6, ...user}
 *          ]
 * @logic   - Récupération des chauffeurs dans la mainDB
 *          - Itération sur les chauffeurs:
 *              Récupération du comptes utilisateurs du chauffeurs si il en a et ajout des donnés combiner au tableau d'objet
 *          - Renvoie du tableau
 * @depends mainDB userDB
 */
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

/**
 * @route   GET parametres/getUser
 * @desc    Récupère tous les utilisateurs (chauffeur inclus)
 * @output  [
 *              { ...user},
 *              {driver_id:6, ...user}
 *          ]
 * @logic   - Récupération des chauffeurs dans la mainDB
 *          - Récupération des utilisateurs dans la userDB
 *          - Itération sur les utilisateurs:
 *              Récupération du comptes utilisateurs du chauffeurs si il en a et ajout des donnés combiner au tableau d'objet
 *          - Renvoie du tableau
 * @depends mainDB userDB
 */
export const getUsers = async (req, res) => {
    const userDb = db.users;
    const planningDb = db.planning;
    let users;
    let drivers;
    try {
        drivers = planningDb.prepare('SELECT * FROM driver').all();
        users = userDb.prepare('SELECT username, role FROM user').all();
    } catch (err) {
        console.error('Error while fetching users: ', err);
        res.status(500).send('Internal server error');
        return;
    }
    let result = users.filter(user => {
        return drivers.every(driver => driver.name !== user.username);
    })
    res.status(200).json(result);
};

/**
 * @route   POST parametres/getHistory
 * @desc    Récupère l'historique des courses en fonction d'une date choisi
 * @input   BODY {date: '25/05/2025'}
 * @output  {data, drivers}
 * @logic   - Récupère dans la mainDB les courses de la date en question
 *          - Récupère les chauffeurs dans la mainDB
 *          - Renvoie les deux données dans un objet
 * @depends mainDB
 */
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

/**
 * @route   POST parametres/CheckName
 * @desc    Récupère tous les utilisateurs, chauffeur comme utilisateur classique.
 * @input   {username:'Patrick'}
 * @output  {exists: true || false}
 * @logic   - Récupération des utilisateurs dans la userDB
 *          - Réponse par vrai ou faux si l'utilisateur est dans la db
 * @depends  userDB
 */
export const CheckUserName = async (req, res) => {
    const { username } = req.body;
    const userDb = db.users;
    let user;
    try {
        user = userDb.prepare('SELECT * FROM user WHERE username = ?').get(username);
    } catch (err) {
        console.error('Error while checking username: ', err);
        res.status(500).send('Internal server error');
        return;
    }
    if (user) {
        res.status(200).json({ exists: true });
    } else {
        res.status(200).json({ exists: false });
    }
}

/**
 * @route   POST parametres/add
 * @desc    Ajoute un chauffeur (Avec ou sans compte utilisateur)
 * @input   BODY {name:'Patrick', color: '#fffff', account: true, role: 'admin'}
 * @output  'Driver added' || randomChar (password)
 * @logic   - Si besoin d'un compte on connecte la db user
 *          - Insertion du chauffeur dans BDD driver de maindb
 *          - Si besoin d'un compte on génère un mot de passe, on le hash et ensuite insertion dans BDD users
 *          - Réponse avec le mot de passe si un compte est demandé
 * @depends mainDB userDB
 */
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

/**
 * @route   POST parametres/addAccount
 * @desc    Ajoute un utilisateur
 * @input   BODY {name:'Patrick', role: 'admin'}
 * @output  'Driver added' || randomChar (password)
 * @logic   - on connecte la db user
 *          - on génère un mot de passe, on le hash et ensuite insertion dans BDD users
 *          - Réponse avec le mot de passe
 * @depends userDB
 */
export const createUser = async (req, res) => {
    const { username, role } = req.body;
    const userDb = db.users;
    let randomChar
    try {
        randomChar = generatePassword();
        const hashedPassword = await bcrypt.hash(randomChar, 10);
        userDb.prepare('INSERT INTO user (username, password, role) VALUES (?, ?, ?)').run(username, hashedPassword, role);
    } catch (err) {
        console.error('Error while creating user: ', err);
        res.status(500).send('Internal server error');
        return;
    }
    res.status(200).send(randomChar);
}

/**
 * @route   POST parametres/modify
 * @desc    Modification d'un chauffeur
 * @input   BODY {id:5, name:'Patrick', color: '#fffff', account: true, role: 'admin'}
 * @output  { message: 'Driver modified', password: randomChar } || { message: 'Driver modified' }
 * @logic   - On récupère l'utilisateur dans la db user si le chauffeur en as un
 *          - Si le chauffeur demande un compte et n'en as pas:
 *              - Génération du mot de passe, hash et insertion du chauffeur dans la db User
 *            Sinon si ne veux plus de compte, 
 *              - Suppression de celui ci dans la db User
 *            Sinon si garde son compte et est present dans la db User
 *              - Mise a jour du role
 *          - Modification du chauffeur dans la main db (toutes les données update avec les nouvelles)
 *          - Réponse avec le mot de passe si un, a été générer pour une demande de compte sinon string
 * @depends mainDB userDB
 */
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

/**
 * @route   POST parametres/modifyAccount
 * @desc    Modification d'un Utilisateur
 * @input   BODY {name:'Patrick', role: 'admin'}
 * @output  'Account modified'
 * @logic   - Mise a jour avec les information recu
 *          - Réponse string
 * @depends userDB
 */
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

/**
 * @route   POST parametres/changePassword
 * @desc    Modifie le mot de passe d'un utilisateur
 * @input   BODY {name:'Patrick', newpassword: 'fgh456dgfdgd'}
 * @output  'Password changed' 
 * @logic   - on connecte la db user
 *          - on vérifie que l'utilisateur existe dans la bdd
 *          - On hash le mot de passe voulu par l'utilisateur et on le stock
 *          - Réponse avec confirmation
 * @depends userDB
 */
export const changePassword = async (req, res) => {
    const { username, newPassword } = req.body;
    const userDb = db.users;
    let user;
    try {
        user = userDb.prepare('SELECT * FROM user WHERE username = ?').get(username);
    } catch (err) {
        console.error('Error while fetching user: ', err);
        res.status(500).send('Internal server error');
        return;
    }
    try {
        const password = await bcrypt.hash(newPassword, 10);
        userDb.prepare('UPDATE user SET password = ? WHERE username = ?').run(password, username);
    } catch (err) {
        console.error('Error while changing password: ', err);
        res.status(500).send('Internal server error');
        return;
    }
    res.status(200).send('Password changed');
}

/**
 * @route   POST parametres/regeneratePassword
 * @desc    Recréer un mot de passe pour un utilisateur
 * @input   BODY {name:'Patrick'}
 * @output  randomChar (password)
 * @logic   - on connecte la db user
 *          - on génère un mot de passe, on le hash et ensuite insertion dans BDD users
 *          - Réponse avec le mot de passe
 * @depends userDB
 */
export const regenPassword = async (req, res) => {
    const { username } = req.body;
    const userDb = db.users;
    let randomChar;
    try {
        randomChar = generatePassword();
        const password = await bcrypt.hash(randomChar, 10);
        userDb.prepare('UPDATE user SET password = ? WHERE username = ?').run(password, username);
    } catch (err) {
        console.error('Error while regenerating password: ', err);
        res.status(500).send('Internal server error');
        return;
    }
    res.status(200).send(randomChar);
}

/**
 * @route   DELETE parametres/delete
 * @desc    Suppression d'un chauffeur
 * @input   BODY {id:5}
 * @output  'Driver deleted'
 * @logic   - Suppression du chauffeur a l'aide de son id
 * @depends mainDB
 */
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

/**
 * @route   DELETE parametres/delete
 * @desc    Suppression d'un utilisateur
 * @input   BODY {name:'Patrick'}
 * @output  'Account deleted'
 * @logic   - Suppression du Utilisateur a l'aide de son nom
 * @depends userDB
 */
export const DeleteAccount = function (req, res) {
    const { name } = req.body;
    const userdb = db.users;
    try {
        userdb.prepare('DELETE FROM user WHERE username = ?').run(name);
    } catch (err) {
        console.error('Error while deleting account: ', err);
        res.status(500).send('Internal server error');
        return;
    }
    res.status(200).send('Account deleted');
}