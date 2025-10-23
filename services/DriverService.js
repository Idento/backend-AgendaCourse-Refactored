import * as driverRepo from '../repositories/driverRepository.js'
import { addAccount, modifyAccountOfDriver } from './AccountService.js'

/**
 * Appel d'une fonction de bdd permettant de récupérer tous les chauffeurs
 * @returns {Promise<Object[]/>}
 */
export async function getAllDrivers() {
    return driverRepo.getAll()
}

/**
 * Sélection d'un chauffeur dans la bdd par son nom
 * @param {string} name 
 * @returns {Promise<Object/>}
 */
export async function getDriverByNameService(name) {
    const data = driverRepo.getDriverByName(name)
    return data
}

/**
 * Ajout d'un chauffeur dans la base de donnée
 * @param {string} name 
 * @param {string} color 
 * @param {boolean} account 
 * @param {string} role 
 * - Vérification si le chauffeur existe, si oui, renvoi d'une erreur
 * - Ajout du chauffeur dans la bdd sinon
 * - Si account = true alors on créer son compte utilisateur avec
 * @returns 
 */
export async function addDrivers(name, color, account, role) {
    const exists = driverRepo.getDriverByName(name)
    if (exists) throw new Error('Driver already exists')
    driverRepo.insertNewDriver(name, color)
    if (account) {
        const data = addAccount(name, role)
        return data
    }
}

/**
 * Modification d'un chauffeur
 * @param {number} id 
 * @param {string} name 
 * @param {string} color 
 * @param {boolean} account 
 * @param {string} role 
 * - Modification du chauffeur dans la bdd chauffeur
 * - Appel de la fonction de modification du compte du chauffeur 
 *   au cas ou quelque chose doit être changer selon les paramêtres
 * @returns 
 */
export async function modifyDriver(id, name, color, account, role) {
    driverRepo.updateDriverById(name, color, id)
    const data = modifyAccountOfDriver(name, account, role)
    return data
}


/**
 * Supression d'un chauffeur a l'aide de son identifiant base de donnée
 * @param {number} id 
 */
export async function deleteDriverService(id) {
    driverRepo.deleteDriverById(id)
}