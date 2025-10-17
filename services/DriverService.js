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
        const data = addAccount(name, role)
        return data
    }
}

export async function modifyDriver(id, name, color, account, role) {
    driverRepo.updateDriverById(name, color, id)
    const data = modifyAccountOfDriver(name, account, role)
    return data
}

export async function deleteDriverService(id) {
    driverRepo.deleteDriverById(id)
}