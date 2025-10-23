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

export async function getPlanningCache() {
    if (planningCache.has('plannings')) return planningCache.get('plannings')

    const plannings = await getPlanning()
    planningCache.set('plannings', plannings)
    return plannings
}

export function invalidatePlanningCache() {
    planningCache.delete('plannings')
}

export async function getDriverPlanningByDateService(driver_id, date = '') {
    const dateForPlanning = date.length > 0 ? date : formatToDate(new Date())
    return planningRepo.selectAllPlanningByDriverIdAndDate(driver_id, dateForPlanning)
}

export async function getHistoryPlanning(date) {
    const drivers = await getAllDrivers()
    const planningData = planningRepo.selectAllPlanningByDate(date)
    return { data: planningData, drivers }
}

export function getDataPlanningForReccurenceCheck(id) {
    return planningRepo.selectOnePlanningByReccurenceId(id)
}

export async function addSimplePlanning(data) {
    planningRepo.insertNewPlanningWithRecurrence(data)
}

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

export function handleChangeRecurrence(recurrence_id, date, frequency, data) {
    const newRecurrence = modifyRecurrence(recurrence_id, date, frequency)
    const dataToDelete = newRecurrence.toDelete.map((item) => ({ date: item, recurrence_id: newRecurrence.id }))
    planningRepo.deleteManyPlanningWithDateAndReccurenceId(dataToDelete)
    const dataToInsert = newRecurrence.toAdd.map((item) => ({ ...data, date: item, long_distance: `${data.long_distance}` }))
    planningRepo.insertManyNewPlanningsWithRecurrence(dataToInsert)
}

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

export function checkOldPlanning() {
    const plannings = planningRepo.selectPlanningWithRecurrence()
    for (const planning of plannings) {
        if (isOlderThanToday(planning.date)) {
            planningRepo.updatePlanningWithId({ ...planning, recurrence_id: 0 })
        }
    }
}

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