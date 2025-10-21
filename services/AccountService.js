import * as accountRepo from '../repositories/userRepository.js'
import generatePassword from '../utils/generatePassword.js'
import { getAllDrivers } from './DriverService.js'
import bcrypt from "bcrypt";

export async function getUsersService() {
    const drivers = await getAllDrivers()
    const users = accountRepo.selectAllUsernameRole()
    const result = users.filter(user => {
        return drivers.every(driver => driver.name !== user.username)
    })
    return result
}

export async function getDriversAccount() {
    const drivers = await getAllDrivers()
    const driversname = drivers.map((d) => d.name)
    const data = accountRepo.selectListOfUserWithUsername(driversname)
    const result = drivers.map((driver) => {
        if (data.some((item) => item.username === driver.name)) {
            return { ...driver, account: true, role: item.role }
        }
    })
    return result
}

export async function checkUserName(username) {
    const user = accountRepo.selectUserWithUserName(username)
    const exists = user ? true : false
    return exists
}

export async function addAccount(name, role) {
    const exists = accountRepo.selectUserWithUserName(name)
    if (exists) throw new Error('account already exists')
    const randomChar = generatePassword()
    const password = await bcrypt.hash(randomChar, 10)
    accountRepo.insertNewUser(name, password, role)
    return randomChar
}

export async function modifyAccountOfDriver(name, account, role) {
    const exists = accountRepo.selectUserWithUserName(name)
    if (account && !exists) {
        const data = addAccount(name, role)
        return data
    } else if (!account && exists) {
        deleteAccount(name)
    } else if (account && exists && exists.role !== role) {
        modifyAccount(name, role)
    }
}

export async function modifyAccount(name, role) {
    accountRepo.updateUserRoleWithUsername(role, name)
}

export async function modifyPassword(name, password) {
    accountRepo.updateUserPasswordWithUsername(password, name)
}

export async function regeneratePasswordService(name) {
    const exists = accountRepo.selectUserWithUserName(name)
    if (!exists) throw new Error('account doesn\'t exists')
    const randomChar = generatePassword()
    const password = bcrypt.hash(randomChar, 10)
    accountRepo.updateUserPasswordWithUsername(password, name)
    return randomChar
}

export async function deleteAccount(name) {
    accountRepo.deleteUserWithUsername(name)
}