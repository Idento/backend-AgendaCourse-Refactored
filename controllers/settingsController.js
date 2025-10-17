import Database from "better-sqlite3";
import generatePassword from "../utils/generatePassword.js";
import bcrypt from "bcrypt";
import { db } from "../utils/allDb.js";
import { addAccount, checkUserName, deleteAccount, getDriversAccount, getUsersService, modifyAccount, modifyPassword, regeneratePasswordService } from "../services/AccountService.js";
import { getHistoryPlanning } from "../services/PlanningService.js";
import { addDrivers, deleteDriverService, modifyDriver } from "../services/DriverService.js";

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
    try {
        const data = getDriversAccount()
        res.status(200).json(data);
    } catch (err) {
        console.error('Error while fetching data: ', err);
        res.status(500).send('Internal server error');
        return;
    }
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
    try {
        const data = getUsersService()
        res.status(200).json(data);

    } catch (err) {
        console.error('Error while fetching users: ', err);
        res.status(500).send('Internal server error');
        return;
    }
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
    try {
        const data = getHistoryPlanning(date)
        res.status(200).json(data);
    } catch (err) {
        console.error('Error while fetching data: ', err);
        res.status(500).send('Internal server error');
    }

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
    try {
        const data = checkUserName(username)
        res.status(200).json({ exists: data });
    } catch (err) {
        console.error('Error while checking username: ', err);
        res.status(500).send('Internal server error');
        return;
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
    try {
        const data = addDrivers(name, color, account, role)
        res.status(200).send(data ?? 'Driver added');
    } catch (err) {
        console.error('Error while adding driver: ', err);
        res.status(500).send('Internal server error');
        return;
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
    try {
        const data = addAccount(username, role)
        res.status(200).send(data);
    } catch (err) {
        console.error('Error while creating user: ', err);
        res.status(500).send('Internal server error');
        return;
    }
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
    try {
        const data = modifyDriver(id, name, color, account, role)
        res.status(200).send(data);
    } catch (err) {
        console.error('Error while modifying driver: ', err);
        res.status(500).send('Internal server error');
        return;
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
    try {
        modifyAccount(name, role)
        res.status(200).send('Account modified');
    } catch (err) {
        console.error('Error while modifying account: ', err);
        res.status(500).send('Internal server error');
        return;
    }
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
    try {
        modifyPassword(username, newPassword)
        res.status(200).send('Password changed');
    } catch (err) {
        console.error('Error while changing password: ', err);
        res.status(500).send('Internal server error');
        return;
    }
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
    try {
        const data = regeneratePasswordService(username)
        res.status(200).send(data)
    } catch (err) {
        console.error('Error while regenerating password: ', err);
        res.status(500).send('Internal server error');
        return;
    }
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
    try {
        deleteDriverService(id)
        res.status(200).send('Driver deleted');
    } catch (err) {
        console.error('Error while deleting driver: ', err);
        res.status(500).send('Internal server error');
        return;
    }
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
    try {
        deleteAccount(name)
        res.status(200).send('Account deleted');
    } catch (err) {
        console.error('Error while deleting account: ', err);
        res.status(500).send('Internal server error');
        return;
    }
}