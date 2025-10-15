import bcrypt from 'bcrypt';
import Database from 'better-sqlite3';
import generatePassword from '../utils/generatePassword.js';
import { db } from '../utils/allDb.js';

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