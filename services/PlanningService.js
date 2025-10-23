import { planningCache } from '../lib/cache.js'
import * as planningRepo from '../repositories/planningRepository.js'
import * as recurrenceRepo from '../repositories/recurrenceRepository.js'
import * as excludedRepo from '../repositories/excludedDaysRepository.js'
import { formatToDate, isOlderThanToday, parseToDate, retrieveDate, retrieveDateFromDate, todayDateFormated } from '../utils/dateUtils.js'
import { toArray } from '../utils/validationData.js'
import { getAllDrivers } from './DriverService.js'
import { createExcludeDays, createRecurrence, deleteRecurrenceService, modifyRecurrence } from './ReccurenceService.js'
import { generateNextDatesWithoutExcludeDays, generateNextDates } from '../utils/recurrenceUtils.js'
import { isBefore } from 'date-fns'

/**
 * Récupération du planning d'aujourd'hui ou de la semaine suivant la date donnée
 * @param {boolean} week 
 * @param {string} date 
 * - Récupération de tous les chauffeurs
 * - Si on veux récupérer toute une semaine week = true:
 *      - on récupère toutes les dates concerné par cette fonction sur une semaine
 *      - On boucle dessus afin de rechercher chaque date dans la base de donnée
 *      - On push les données dans un tableau sous le format désiré
 * - Sinon on récupère le planning d'aujourd'hui
 * - et on renvoie les données sous le format désiré
 * @returns {Promise<object[]/>}
 */
export async function getPlanning(week = false, date = '') {
    const drivers = await getAllDrivers() || []
    if (week) {
        const weekDays = date.length > 0 ? retrieveDateFromDate(date) : retrieveDate()
        let result = []
        for (let i = 0; i < weekDays.length; i++) {
            const planning = planningRepo.selectPlanningFrequencyWithDate(weekDays[i])
            result.push({ date: weekDays[i], data: [...planning, { drivers }] })
        }
        return result
    } else {
        const today = todayDateFormated()
        const planning = planningRepo.selectPlanningFrequencyWithDate(today)
        const result = [...planning, { drivers }]
        return result
    }
}

/**
 * Récupération du planning d'aujourd'hui via le cache du serveur
 * - Si le cache est présent on l'envoi
 * - Sinon le cache a été invalidé et donc on récupère les données dans la bdd afin d'avoir les nouvelles données
 * @returns {Promise<object[]/>}
 */
export async function getPlanningCache() {
    if (planningCache.has('plannings')) return planningCache.get('plannings')

    const plannings = await getPlanning()
    planningCache.set('plannings', plannings)
    return plannings
}

/**
 * Invalidation du cache
 */
export function invalidatePlanningCache() {
    planningCache.delete('plannings')
}


/**
 * Récupération du planning du chauffeur en fonction de son identifiant base de donnée a la date voulu ou aujourd'hui
 * @param {number} driver_id 
 * @param {string} date 
 * @returns {Promise}
 */
export async function getDriverPlanningByDateService(driver_id, date = '') {
    const dateForPlanning = date.length > 0 ? date : formatToDate(new Date())
    return planningRepo.selectAllPlanningByDriverIdAndDate(driver_id, dateForPlanning)
}

/**
 * Récupération du planning antérieur à aujourd'hui
 * @param {string} date 
 * - Récupération des chauffeurs
 * - Récupération du planning
 * - Envoi du tout afin de pouvoir combiner les données
 * @returns {Promise<object/>}
 */
export async function getHistoryPlanning(date) {
    const drivers = await getAllDrivers()
    const planningData = planningRepo.selectAllPlanningByDate(date)
    return { data: planningData, drivers }
}

/**
 * Récupération d'une ligne du planning en fonction de l'identifiant de recurrence
 * @param {number} id 
 * @returns {object}
 */
export function getDataPlanningForReccurenceCheck(id) {
    return planningRepo.selectOnePlanningByReccurenceId(id)
}

/**
 * Insertion du planning dans la base de donnée
 * @param {object} data 
 */
export async function addSimplePlanning(data) {
    planningRepo.insertNewPlanningWithRecurrence(data)
}


/**
 * Ajout d'un nouveau planning dans la base de donnée
 * @param {object[]} data 
 * - Boucle sur le tableau d'objet a ajouté 
 * - Destructuration de l'objet a l'intérieur du tableau pour récupération des données
 * - Si une frequence (de recurrence) est détecter:
 *      - On créer une récurrence, on récupère les dates générer par le service de recurrence
 *      - Et on map ces dates afin d'y ajouter les données
 *      - Enfin insertion de toutes les dates/données dans la base de donnée
 * - Sinon simple ajout de la course dans la base de donnée
 * @returns {Promise<object/>}
 */
export async function addPlanning(data) {
    const success = []
    const failed = []
    for (let i = 0; i < data.length; i++) {
        const { driver_id, date = formatToDate(new Date()), client_name, start_time, return_time, note, destination, long_distance, frequency } = data[i];
        const frequencyFormated = toArray(frequency)
        console.log('frequency', frequencyFormated);
        if (frequencyFormated && frequencyFormated.length > 0) {
            try {
                const { recurrence_id, allDays } = createRecurrence(date, frequencyFormated)
                const planningToInsert = { driver_id, client_name, start_time, return_time, note, destination, long_distance: `${long_distance}`, recurrence_id: parseInt(recurrence_id) }
                const allDaysData = allDays.map((item) => ({ ...planningToInsert, date: item }))
                if (allDaysData[0].date !== date) {
                    allDaysData.push({ ...planningToInsert, date: date })
                }
                console.log(allDaysData);
                planningRepo.insertManyNewPlanningsWithRecurrence(allDaysData)
                success.push({ client_name, recurrence_id })
            } catch (err) {
                failed.push({ driver_id, date, client_name, start_time, return_time, note, destination, long_distance, frequency, err })
            }
        } else {
            const planningToInsert = { driver_id, date, client_name, start_time, return_time, note, destination, long_distance: `${long_distance}` }
            try {
                const addPlanning = planningRepo.insertNewPlanningWithoutRecurrence(planningToInsert)
                console.log(addPlanning.lastInsertRowid);
                success.push(addPlanning.lastInsertRowid)
            } catch (err) {
                failed.push(planningToInsert)
                console.log(err);
            }
        }
    }
    invalidatePlanningCache()
    return { success, failed }
}


/**
 * Fonction de changement de la récurrence associé a son id
 * @param {number} recurrence_id 
 * @param {string} date 
 * @param {string || object[]} frequency 
 * @param {object} data 
 * - Génération des nouvelles dates en fonction de la date donnée => retourne des dates a ajoutées et d'autre a supprimer
 * - Supression des dates qui ne correspondent plus a la recurrence en fonction de l'id de la récurrence
 * - Pour les dates a ajouté dans la bdd, on itère sur elles afin de rajouter les données a insérer dans la bdd
 * - Insertion de toutes les dates a ajoutés a la bdd
 */
export function handleChangeRecurrence(recurrence_id, date, frequency, data) {
    const newRecurrence = modifyRecurrence(recurrence_id, date, frequency)
    const dataToDelete = newRecurrence.toDelete.map((item) => ({ date: item, recurrence_id: newRecurrence.id }))
    planningRepo.deleteManyPlanningWithDateAndReccurenceId(dataToDelete)
    const dataToInsert = newRecurrence.toAdd.map((item) => ({ ...data, date: item, long_distance: `${data.long_distance}` }))
    planningRepo.insertManyNewPlanningsWithRecurrence(dataToInsert)
}

/**
 * Modification d'une course dans le planning
 * @param {object} data 
 * - Si changement de date avec changement de recurrence, on recalcule les recurrence:
 *      - Si la nouvelle date est avant la prochaine date reccurente, on calcule a partir de la nouvelle date
 *      - Sinon on calcule a partir de la prochaine date recurrence
 * - Sinon Si juste la fréquence a changer:
 *      - Si le tableau de recurrence est vide:
 *          - On supprime toutes les courses recurrente a partir de cette date
 *          - on supprime la recurrencce
 *      - Sinon si il n'y avait pas recurrence sur cette course et que maintenant il y en a:
 *          - On créer la recurrence avec la fonction dédié a ca
 *      - Sinon on recalcule juste la recurrence
 * - Sinon si la recurrence n'as pas bougé:
 *      - Si on change la date et que cette course a une recurrence:
 *          - on update la course avec la nouvelle date
 *          - on exclu l'ancienne date des dates possible pour cette récurrence
 *      - Sinon si juste la date change sans qu'il y ai de recurrence:
 *          - on met a jour avec la nouvelle date
 *      - Sinon c'est juste un autre changement qui ne concerne pas les dates:
 *          - on update la course
 * - Renvoie d'un string
 * @returns {Promise<string/>}
 */
export async function modifyPlanning(data) {
    const { id, driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id, frequency, newDate } = data
    const dbRecurrenceData = recurrenceRepo.selectWithId(recurrence_id)
    const frequencyChanged = JSON.stringify(toArray(dbRecurrenceData?.frequency)) !== JSON.stringify(toArray(frequency))
    const isBeforeNextDay = newDate && frequencyChanged ? isBefore(parseToDate(newDate), parseToDate(dbRecurrenceData?.next_day)) : null
    const dataForInsertion = { id, driver_id, client_name, start_time, return_time, note, destination, long_distance, recurrence_id }
    const newDateIsStartDate = date === dbRecurrenceData?.start_date && !!newDate
    let result = 'failed modify'
    console.log('frequencyChanged:', frequencyChanged, 'Frequency sent:', frequency, 'dbfrequency:', dbRecurrenceData?.frequency);

    try {
        if (newDateIsStartDate && frequencyChanged) { // Si la startdate change, on doit recalculer toutes les recurrences
            console.log(isBeforeNextDay);
            if (isBeforeNextDay) {
                handleChangeRecurrence(dbRecurrenceData.id, newDate, frequency, dataForInsertion)
            } else {
                handleChangeRecurrence(dbRecurrenceData.id, dbRecurrenceData.next_day, frequency, dataForInsertion)
            }
        } else if (frequencyChanged) {
            if (toArray(frequency)?.length === 0) {
                const allRecurrenceInPlanning = planningRepo.selectAllPlanningByRecurrenceId(recurrence_id)
                for (const planning of allRecurrenceInPlanning) {
                    if (parseToDate(planning.date) > parseToDate(date)) {
                        planningRepo.deletePlanningWithId(planning.id)
                    } else {
                        planningRepo.updatePlanningRecurrenceIdWithId(0, planning.id)
                    }
                }
                deleteRecurrenceService(recurrence_id)
            } else if (!dbRecurrenceData?.frequency && toArray(frequency).length > 0) {
                console.log('in good if');
                const { recurrence_id, allDays } = createRecurrence(date, frequency)
                const planningToInsert = { driver_id, client_name, start_time, return_time, note, destination, long_distance: `${long_distance}`, recurrence_id }
                console.log(allDays);
                const allDaysData = allDays.map((item) => ({ ...planningToInsert, date: item }))
                planningRepo.updatePlanningRecurrenceIdWithId(recurrence_id, id)
                planningRepo.insertManyNewPlanningsWithRecurrence(allDaysData)
            } else {
                handleChangeRecurrence(dbRecurrenceData.id, dbRecurrenceData.start_date, frequency, dataForInsertion)
            }
        } else {// if newdate, ajouter une course a la date de newdate sans recurrence et si elle possède une recurrence, ajouter un excluded days
            if (newDate && frequency.length > 0) {
                planningRepo.updatePlanningWithId({ ...dataForInsertion, date: newDate, long_distance: `${long_distance}`, recurrence_id: 0 })
                const excludedExists = excludedRepo.selectExcludedWithRecurrenceId(recurrence_id)
                if (excludedExists) {
                    const excludeddate = JSON.parse(excludedExists.date)
                    excludeddate.push(date)
                    excludedRepo.updateExcludedDateWithRecurrenceId(recurrence_id, JSON.stringify(excludeddate))
                } else {
                    excludedRepo.insertExcluded(recurrence_id, JSON.stringify([date]))
                }
            } else if (newDate) {
                planningRepo.updatePlanningWithId({ ...dataForInsertion, date: newDate, long_distance: `${long_distance}` })
            } else {
                planningRepo.updatePlanningWithId({ ...dataForInsertion, date: date, long_distance: `${long_distance}` })
            }
        }
        result = 'success modify planning'
    } catch (err) {
        console.log('modify error', err);
    }
    invalidatePlanningCache()
    return result
}

/**
 * Supression d'une course dans le planning
 * @param {object} data 
 * - Si on veux supprimer la recurrence en même temps que la course:
 *      - Supression de la course avec son id
 *      - Suppression de la recurrence
 * - Sinon si on veux pas supprimer la recurrence mais qu'il y en as une:
 *      - On exclue la date qu'on supprime dans les dates possibles de cette recurrence
 *          - Si la ligne a supprimer concerne la start_date ou next_day, on recalcule la recurrence
 * - Sinon on supprime la course
 * @returns 
 */
export async function deletePlanning(data) {
    const { id, deleteRecurrence } = data
    const line = planningRepo.selectPlanningById(id)
    const recurrence = line?.recurrence_id ? recurrenceRepo.selectWithId(line.recurrence_id) : {}
    console.log(line);
    let result = 'failed delete'
    try {
        if (deleteRecurrence) {
            planningRepo.deletePlanningWithRecurrenceId(line.recurrence_id)
            deleteRecurrenceService(line.recurrence_id)
        } else if (!deleteRecurrence && (line.recurrence_id !== '0' || line.recurrence_id !== 0)) {
            createExcludeDays(line.recurrence_id, line.date)
            planningRepo.deletePlanningWithId(id)
            if (line.date === recurrence.start_date) {
                modifyRecurrence(recurrence.id, recurrence.next_day, toArray(recurrence.frequency))
            } else if (line.date === recurrence.next_day) {
                modifyRecurrence(recurrence.id, recurrence.start_date, toArray(recurrence.frequency))
            }
        } else {
            planningRepo.deletePlanningWithId(id)
        }
        result = 'success delete planning'
    } catch (err) {
        console.log('delete error', err);
    }
    invalidatePlanningCache()
    return result
}

/**
 * Vérification au démarrage 
 * -> De toutes la table planning pour que les dates qui sont passé, ne soit pas pris en compte dans les recurrences, sans être supprimer
 * on met juste la recurrence_id a 0 pour celles-ci
 */
export function checkOldPlanning() {
    const plannings = planningRepo.selectPlanningWithRecurrence()
    for (const planning of plannings) {
        if (isOlderThanToday(planning.date)) {
            planningRepo.updatePlanningWithId({ ...planning, recurrence_id: 0 })
        }
    }
}

/**
 * Vérification de toutes les récurrences au démarrage et modification/ajout/supression dans le planning en fonction
 * - Boucle sur toutes les recurrences:
 *      - Sélection de toutes les courses contenant la recurrence id sur la boucle actuel
 *      - Si il n'y a pas de course avec une date correspondant au début de la recurrence ET que cette date n'est pas exclus:
 *          - On insère une course a cette date là
 *      - Si il n'y a pas de jours exclus et qu'il y a déjà des courses de cette récurrence:
 *          - on génére les dates normalement présente
 *          - On boucle sur les dates générer:
 *              - Si la date normalement dans le planning n'y est pas on la rajoute dans la base de donnée
 *      - Sinon si il y a des jours exclus dans cette recurrence et qu'il y a déjà des courses dans le planning pour cette récurrence:
 *          - on génère les dates en excluant celle qui sont exclus
 *          - On ajoute les dates manquantes
 *      - Sinon si il y a pas de course qui conerne une recurrence, on l'as supprime, elle ne devrait pas être là
 */
export function checkPlanningRecurrence() {
    const allRecurrence = recurrenceRepo.selectAll()
    for (const reccurence of allRecurrence) {
        const allPlanningData = planningRepo.selectAllPlanningByRecurrenceId(reccurence.id)
        const excludedDays = excludedRepo.selectExcludedWithRecurrenceId(reccurence.id)
        if (!allPlanningData.some(item => item.date === reccurence.start_date) && !toArray(excludedDays?.date).includes(reccurence.start_date)) {
            const dataPlanningCopyWithStarDate = { ...allPlanningData[0], date: reccurence.start_date, recurrence_id: reccurence.id }
            delete dataPlanningCopyWithStarDate.id
            console.log('checkplanningrecurrence StartDate:', dataPlanningCopyWithStarDate);
            planningRepo.insertNewPlanningWithRecurrence(dataPlanningCopyWithStarDate)
        }
        if (!excludedDays && allPlanningData.length > 0) {
            const allDates = generateNextDates(reccurence.start_date, reccurence.frequency)
            for (const date of allDates) {
                if (!allPlanningData.some(item => item.date === date)) {
                    const dataPlanningCopy = { ...allPlanningData[0], date: date }
                    console.log('checkplanningrecurrence:', dataPlanningCopy);
                    planningRepo.insertNewPlanningWithRecurrence(dataPlanningCopy)
                }
            }
        } else if (excludedDays && allPlanningData.length > 0) {
            const AllDatesWithoutRecurrence = generateNextDatesWithoutExcludeDays(reccurence.start_date, reccurence.frequency, excludedDays.date)
            for (const date of AllDatesWithoutRecurrence) {
                if (!allPlanningData.some(item => item.date === date)) {
                    const dataPlanningCopy = { ...allPlanningData[0], date: date }
                    console.log('checkplanningrecurrence WithExcluded:', dataPlanningCopy);
                    planningRepo.insertNewPlanningWithRecurrence(dataPlanningCopy)
                }
            }
        } else {
            if (allPlanningData.length === 0) {
                deleteRecurrenceService(reccurence.id)
            }
        }
    }
}