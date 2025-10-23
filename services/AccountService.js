import * as accountRepo from '../repositories/userRepository.js'
import generatePassword from '../utils/generatePassword.js'
import { getAllDrivers, getDriverByNameService } from './DriverService.js'
import bcrypt from "bcrypt";

/**
 * Récupère tous les utilisateurs:
 * - Récupère d'abord tous les chauffeurs
 * - Récupère ensuite tous les utilisateurs 
 * - Tri des utilisateurs qui sont des chauffeurs: 
 *      - ici on ne veux récupérer que les utilisateurs accédant a l'application,
 *        pas qui sont chauffeurs
 * - On renvoi le tableau trier
 * @returns {Promise<Object[]>}
 */
export async function getUsersService() {
    const drivers = await getAllDrivers()
    const users = accountRepo.selectAllUsernameRole()
    const result = users.filter(user => {
        return drivers.every(driver => driver.name !== user.username)
    })
    return result
}

/**
 * Récupère tous les utilisateurs:
 * - Récupère d'abord tous les chauffeurs
 * - Récupère ensuite tous les utilisateurs qui ont le nom des chauffeurs (nom unique)
 * - map sur les chauffeurs afin de savoir si ils ont un compte en regardant si ils sont dans la liste des users
 *      - Si ils ont un compte, on renvoi "account": true
 *      - Sinon "account": false
 * - On renvoi ensuite le tableau
 * @returns {Promise<Object[]>}
 */
export async function getDriversAccount() {
    const drivers = await getAllDrivers()
    const driversname = drivers.map((d) => d.name)
    const data = accountRepo.selectListOfUserWithUsername(driversname)
    const result = drivers.map((driver) => {
        if (data.some((item) => item.username === driver.name)) {
            const index = data.findIndex((item) => item.username === driver.name)
            return { ...driver, account: true, role: data[index].role }
        } else {
            return { ...driver, account: false, role: null }
        }
    })
    return result
}

/**
 * Vérification de nom dans les base de donnée afin que chacun soit unique
 * @param {string} username 
 * - Récupération de l'utilisateur avec le paramètre username donné, si rien undefined
 * - Récupération de chauffeur avec le paramètre username donné, si rien undefined
 * - Si un des deux, utilisateur ou chauffeur existe, on renvoie le booléen true
 * @returns {Promise<Boolean/>}
 */
export async function checkUserName(username) {
    const user = accountRepo.selectUserWithUserName(username)
    const driver = await getDriverByNameService(username)
    const exists = user || driver ? true : false
    return exists
}

/**
 * Ajout d'un utilisateur
 * @param {string} name 
 * @param {string} role 
 * - Vérification de si l'utilisateur existe:
 *      - Si oui renvoie une erreur
 * - Éxécution d'une fonction qui renvoie un nombre de charactère choisi aléatoirement
 * - Éxécution du hash du mot de passe
 * - Insertion dans la base de donnée
 * - Retourne le mot de passe
 * @returns {Promise<string/>}
 */
export async function addAccount(name, role) {
    const exists = accountRepo.selectUserWithUserName(name)
    if (exists) throw new Error('account already exists')
    const randomChar = generatePassword()
    const password = await bcrypt.hash(randomChar, 10)
    accountRepo.insertNewUser(name, password, role)
    return randomChar
}

/**
 * Modification du compte d'un chauffeur
 * @param {string} name 
 * @param {boolean} account 
 * @param {string} role 
 * - Récupération du compte du chauffeur si existant
 *      - Si le paramètre account =  true et que le compte n'est pas existant, on veux un compte:
 *          - Création du compte du chauffeur
 *      - Si le le paramètre account = false et que le compte existe, on veux supprimer le compte:
 *          - On supprime le compte du chauffeur
 *      - Si le compte existe et account = true et que le role est différent de celui de la bdd:
 *          - Modification du role
 * @returns 
 */
export async function modifyAccountOfDriver(name, account, role) {
    const exists = accountRepo.selectUserWithUserName(name)
    if (account && !exists) {
        const data = addAccount(name, role)
        return data
    } else if (!account && exists) {
        await deleteAccount(name)
    } else if (account && exists && exists.role !== role) {
        modifyAccount(name, role)
    }
}


/**
 * Appel de la fonction de mise a jour du role du compte a l'aide du nom
 * @param {string} name 
 * @param {string} role 
 */
export async function modifyAccount(name, role) {
    accountRepo.updateUserRoleWithUsername(role, name)
}

/**
 * Modification du mot de passe a l'aide du nom
 * @param {string} name 
 * @param {string} password 
 * - Éxécution du hash du mot de passe
 * - modification de celui ci dans la base de donnée
 */
export async function modifyPassword(name, password) {
    const newPassword = await bcrypt.hash(password, 10)
    accountRepo.updateUserPasswordWithUsername(newPassword, name)
}

/**
 * Régénération automatique du mot de passe
 * @param {string} name 
 * - Vérification d'un compte existant, Si non, envoie d'une erreur
 * - Sinon création du mot de passe via une fonction de randomisation de charactère
 * - Éxécution du hash du mot de passe
 * - Mise a jour du compte avec le nouveau mot de passe dans la bdd
 * - Renvoie de celui ci pour que l'utilisateur puisse se connecter
 * @returns {Promise<string/>}
 */
export async function regeneratePasswordService(name) {
    const exists = accountRepo.selectUserWithUserName(name)
    if (!exists) throw new Error('account doesn\'t exists')
    const randomChar = generatePassword()
    const password = await bcrypt.hash(randomChar, 10)
    accountRepo.updateUserPasswordWithUsername(password, name)
    return randomChar
}

/**
 * Appel de la fonction permettant de supprimer le compte a partir d'un nom
 * @param {string} name 
 */
export async function deleteAccount(name) {
    accountRepo.deleteUserWithUsername(name)
}