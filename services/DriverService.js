import * as driverRepo from '../repositories/driverRepository'


export async function getAllDrivers() {
    return driverRepo.getAll()
}