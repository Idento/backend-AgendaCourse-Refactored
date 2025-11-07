import { addAccount, checkUserName, deleteAccount, getDriversAccount, getUsersService, modifyAccount, modifyPassword, regeneratePasswordService } from "../services/AccountService.js";
import { getHistoryPlanning } from "../services/PlanningService.js";
import { addDrivers, deleteDriverService, modifyDriver } from "../services/DriverService.js";

/**
 * @route   GET parametres/get
 * @desc    Récupère tous les chauffeurs .
 * @access private
 * @output  [
 *              {driver_id:5, ...driver, account: false, role: ''},
 *              {driver_id:6, ...driver, account: true, role: 'Conducteur'}
 *          ]
 * @logic   - Récupère tous les chauffeurs avec informations de si un compte est posséder ou pas
 */
export const GetDrivers = async function (req, res) {
    try {
        const data = await getDriversAccount()
        res.status(200).json(data);
    } catch (err) {
        console.error('Error while fetching data: ', err);
        res.status(500).send('Internal server error');
        return;
    }
}

/**
 * @route   GET parametres/getUser
 * @desc    Récupère tous les utilisateurs simple (pas les chauffeurs)
 * @access private
 * @output  [
 *              { ...user},
 *              {driver_id:6, ...user}
 *          ]
 * @logic   - Récupération des chauffeurs dans la mainDB
 *          - Récupération des utilisateurs dans la userDB
 *          - Itération sur les utilisateurs:
 *              Récupération du comptes utilisateurs du chauffeurs si il en a et ajout des donnés combiner au tableau d'objet
 *          - Renvoie du tableau
 */
export const getUsers = async (req, res) => {
    try {
        const data = await getUsersService()
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
 * @access private
 * @input   BODY {date: '25/05/2025'}
 * @output  {data, drivers}
 * @logic   - Renvoie le planning de la journée et les chauffeurs pour faire l'assemblage finale du planning
 */
export const GetHistoryData = async function (req, res) {
    const { date } = req.body;
    try {
        const data = await getHistoryPlanning(date)
        res.status(200).json(data);
    } catch (err) {
        console.error('Error while fetching data: ', err);
        res.status(500).send('Internal server error');
    }

}

/**
 * @route   POST parametres/CheckName
 * @desc    Récupère tous les utilisateurs, chauffeur comme utilisateur classique.
 * @access private
 * @input   {username:'Patrick'}
 * @output  {exists: true || false}
 * @logic   - Réponse par vrai ou faux si l'utilisateur est dans la db
 * @depends  userDB
 */
export const CheckUserName = async (req, res) => {
    const { username } = req.body;
    try {
        const data = await checkUserName(username)
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
 * @access private
 * @input   BODY {name:'Patrick', color: '#fffff', account: true, role: 'admin'}
 * @output  'Driver added' || randomChar (password)
 * @logic   - Créer un chauffeur et réponse avec le mot de passe si un compte est demandé
 */
export const AddDrivers = async function (req, res) {
    const { name, color, account, role } = req.body;
    try {
        const data = await addDrivers(name, color, account, role)
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
 * @access private
 * @input   BODY {name:'Patrick', role: 'admin'}
 * @output  'Driver added' || randomChar (password)
 * @logic   - Créer un utilisateur et réponse avec le mot de passe
 */
export const createUser = async (req, res) => {
    const { username, role } = req.body;
    try {
        const data = await addAccount(username, role)
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
 * @access private
 * @input   BODY {id:5, name:'Patrick', color: '#fffff', account: true, role: 'admin'}
 * @output  { message: 'Driver modified', password: randomChar } || { message: 'Driver modified' }
 * @logic   - Modification du chauffeur (compte inclus si changement quelconque de celui ci)
 */
export const ModifyDrivers = async function (req, res) {
    const { id, name, color, account, role } = req.body;
    try {
        const data = await modifyDriver(id, name, color, account, role)
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
 * @access private
 * @input   BODY {name:'Patrick', role: 'admin'}
 * @output  'Account modified'
 * @logic   - Mise a jour avec les information recu
 * @depends userDB
 */
export const ModifyAccount = async function (req, res) {
    const { name, role } = req.body;
    try {
        await modifyAccount(name, role)
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
 * @access private
 * @input   BODY {name:'Patrick', newpassword: 'fgh456dgfdgd'}
 * @output  'Password changed' 
 * @logic   - Changement du mot de passe et réponse avec confirmation ou erreur
 * @depends userDB
 */
export const changePassword = async (req, res) => {
    const { username, newPassword } = req.body;
    try {
        await modifyPassword(username, newPassword)
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
 * @access private
 * @input   BODY {name:'Patrick'}
 * @output  randomChar (password)
 * @logic   - Création d'un nouveau mot de passe et réponse avec le mot de passe
 * @depends userDB
 */
export const regenPassword = async (req, res) => {
    const { username } = req.body;
    try {
        const data = await regeneratePasswordService(username)
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
 * @access private
 * @input   BODY {id:5}
 * @output  'Driver deleted'
 * @logic   - Suppression du chauffeur a l'aide de son id
 * @depends mainDB
 */
export const DeleteDrivers = async function (req, res) {
    const { id } = req.body;
    try {
        await deleteDriverService(id)
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
 * @access private
 * @input   BODY {name:'Patrick'}
 * @output  'Account deleted'
 * @logic   - Suppression d'un Utilisateur a l'aide de son nom
 * @depends userDB
 */
export const DeleteAccount = async function (req, res) {
    const { name } = req.body;
    try {
        await deleteAccount(name)
        res.status(200).send('Account deleted');
    } catch (err) {
        console.error('Error while deleting account: ', err);
        res.status(500).send('Internal server error');
        return;
    }
}
