import * as recurrenceRepo from '../repositories/recurrenceRepository.js'
import * as excludedRepo from '../repositories/excludedDaysRepository.js'
import { generateNextDates } from '../utils/recurrenceUtils.js'
import { formatToDate, isOlderThanToday, parseToDate } from '../utils/dateUtils.js'
import { addSimplePlanning, getDataPlanningForReccurenceCheck } from './PlanningService.js'
import { toArray } from '../utils/validationData.js'
import { selectAllPlanningByRecurrenceId } from '../repositories/planningRepository.js'
import { startOfDay } from 'date-fns'


/**
 * Création d'une récurrence et ajout en base de donnée
 * @param {string} start_date 
 * @param {string || object[]} weekdays 
 * - Génération des prochaines dates de la récurrences
 * - Insertion de la date initial et de la prochaine date de la recurrence ainsi que sa fréquence
 * - Renvoie des dates des jours de recurrence
 * @returns {object}
 */
export function createRecurrence(start_date, weekdays) {
    const frequency = toArray(weekdays)
    if (!Array.isArray(frequency)) throw new Error('weekdays is not an array')
    const nextDays = generateNextDates(start_date, frequency)
    const insertedRecurrence = recurrenceRepo.insertRecurrence(JSON.stringify(frequency), start_date, start_date === nextDays[0] ? nextDays[1] : nextDays[0])
    return { recurrence_id: insertedRecurrence.lastInsertRowid, allDays: nextDays }
}

/**
 * Ajouter des dates exclus d'une recurrence
 * @param {number} recurrence_id 
 * @param {string} date 
 * - Vérification si il y a des dates déjà exclus
 * - Si non insertion
 * - Si oui update
 */
export function createExcludeDays(recurrence_id, date) {
    const exists = excludedRepo.selectExcludedWithRecurrenceId(recurrence_id)
    if (!exists) {
        excludedRepo.insertExcluded(recurrence_id, JSON.stringify([date]))
    } else {
        const dates = JSON.parse(exists.date)
        const newDates = [...dates, date]
        excludedRepo.updateExcludedDateWithRecurrenceId(recurrence_id, JSON.stringify(newDates))
    }
}


/**
 * Modification de récurrence déjà présente
 * @param {number} id 
 * @param {string} start_date 
 * @param {string || object[]} weekDays 
 * - Génération des dates selon la nouvelle date passer en paramètre
 * - Génération des dates selon l'ancienne date
 * - Vérification de potentiel date exclus
 * - tri des dates a ajouter, les dates a ajouter ne doivent pas être presente dans les anciennes dates ni dans les exclus
 * - tri des dates a supprimer, elles ne doivent pas être dans les nouvelles dates
 * - On vérifie que le next_day n'est pas exclus sinon on prend encore la prochaine date
 * - On renvoie l'id de la recurrence modifié, les dates a ajouter et les dates a supprimer
 * @returns {object}
 */
export function modifyRecurrence(id, start_date, weekDays) {
    const frequency = toArray(weekDays)
    if (!Array.isArray(frequency)) throw new Error('weekdays is not an array')
    const oldData = recurrenceRepo.selectWithId(id)
    const newRecurrence = generateNextDates(start_date, weekDays)
    const oldRecurrence = generateNextDates(oldData.start_date, oldData.frequency)
    const excludedRow = excludedRepo.selectExcludedWithRecurrenceId(id)
    const excludedDates = excludedRow?.date || '[]'
    const datesToExclude = toArray(excludedDates)

    const toAdd = newRecurrence.filter(d => !oldRecurrence.includes(d) && !datesToExclude.includes(d))
    const toDelete = oldRecurrence.filter(d => !newRecurrence.includes(d))

    const filterToCalculateNextDay = newRecurrence.filter(d => !datesToExclude.includes(d))
    const next_day = start_date === filterToCalculateNextDay[0] ? filterToCalculateNextDay[1] : filterToCalculateNextDay[0];
    recurrenceRepo.updateRecurrenceWithId({ frequency: JSON.stringify(frequency), start_date, next_day, id })

    return { id, toAdd, toDelete }
}

/**
 * Supression de recurrence
 * @param {number} id 
 * Supression de la recurrence en fonction de son id
 * et supression des jours exclus pour cette recurrence
 */
export function deleteRecurrenceService(id) {
    recurrenceRepo.deleteRecurrenceWithId(id)
    excludedRepo.deleteExcludedWithReccurenceId(id)
}

/**
 * Vérification au démarrage si la start_date est plus ancienne qu'aujourd'hui
 * - Récupération de toutes les recurrences
 * - Boucles sur les récurrences
 * - Si la start_date est plus ancienne qu'aujourd'hui:
 *      - Si pas de data pour ajouter les planning, renvoie l'erreur
 *      - Si le next_day n'est pas plus vieux qu'aujourd'hui :
 *          -on modifie la recurrence a partir de cette date
 *      - Sinon SI next_day est dépasser:
 *          - Initialisation d'une boucle while avec sécurité de 10 essaie
 *          - Dans la boucle on génère des dates, jusqu'a arriver a une date supérieur ou égale
 *          - une fois que c'est fait on modifie la recurrence a partir de cette date
 */
export function checkRecurrenceStartDates() {
    const allRecurrence = recurrenceRepo.selectAll()
    for (const recurrence of allRecurrence) {
        const dataPlanning = getDataPlanningForReccurenceCheck(recurrence.id)
        if (isOlderThanToday(recurrence.start_date)) {
            if (!dataPlanning) throw new Error('No Data Found for update recurrence')
            if (!isOlderThanToday(recurrence.next_day)) {
                const { id, toAdd, toDelete } = modifyRecurrence(recurrence.id, recurrence.next_day, recurrence.frequency)
                for (const add of toAdd) {
                    const data = { ...dataPlanning, date: add }
                    addSimplePlanning(data)
                }
            } else if (startOfDay(new Date()) > startOfDay(parseToDate(recurrence.next_day))) {
                const maxAttempts = 10;
                const today = new Date()
                let numberOfAttempts = 0;
                let result = false;
                let maxDateOfIteration = recurrence.next_day
                while (!result && numberOfAttempts < maxAttempts) {
                    const dates = generateNextDates(maxDateOfIteration, recurrence.frequency)
                    result = dates.find((date) => startOfDay(parseToDate(date)) >= startOfDay(today)) ?? false
                    maxDateOfIteration = dates[dates.length - 1]
                    numberOfAttempts++;
                }
                const { id, toAdd, toDelete } = modifyRecurrence(recurrence.id, result, recurrence.frequency)
                for (const add of toAdd) {
                    const data = { ...dataPlanning, date: add }
                    addSimplePlanning(data)
                }
            }
        }
    }
}

