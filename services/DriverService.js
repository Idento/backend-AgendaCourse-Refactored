import * as driverRepo from '../repositories/driverRepository'
import { addAccount, modifyAccountOfDriver } from './AccountService'


export async function getAllDrivers() {
    return driverRepo.getAll()
}

export async function addDrivers(name, color, account, role) {
    const exists = driverRepo.getDriverByName(name)
    if (exists) throw new Error('Driver already exists')
    driverRepo.insertNewDriver(name, color)
    if (account) {
        addAccount(name, role)
    }
}

export async function modifyDriver(id, name, color, account, role) {
    driverRepo.updateDriverById(name, color, id)
    modifyAccountOfDriver(name, account, role)
}

export async function deleteDriver(id) {
    driverRepo.deleteDriverById(id)
}