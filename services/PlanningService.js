import * as planningRepo from '../repositories/planningRepository'
import * as recurrenceRepo from '../repositories/recurrenceRepository'
import { isOlderThanToday, parseToDate, retrieveDate, retrieveDateFromDate, todayDateFormated } from '../utils/dateUtils'
import { generateNextDates, generateNextDatesWithoutExcludeDays } from '../utils/recurrenceUtils'
import { toArray } from '../utils/validationData'
import { getAllDrivers } from './DriverService'
import { createExcludeDays, createRecurrence, modifyRecurrence } from './ReccurenceService'


export async function getPlanning(week = false, date = '') {
    const driver = await getAllDrivers()
    if (week) {
        const weekDays = date.length > 0 ? retrieveDateFromDate(date) : retrieveDate()
        let result = []
        for (let i = 0; i < weekDays.length; i++) {
            const planning = planningRepo.selectPlanningFrequencyWithDate(weekDays[i])
            result.push({ date: weekDays[i], data: [...planning, driver] })
        }
    } else {
        const today = todayDateFormated()
        const planning = planningRepo.selectPlanningFrequencyWithDate(today)
        const result = [...planning, ...driver]
        return result
    }
}

export async function getDriverPlanningByDate(driver_id, date) {
    return planningRepo.selectAllPlanningByDriverIdAndDate(driver_id, date)
}

export async function getHistoryPlanning(date) {
    const drivers = await getAllDrivers()
    const planningData = planningRepo.selectAllPlanningByDate(date)
    return { data: planningData, drivers }
}

export async function getDataPlanningForReccurenceCheck(id) {
    return planningRepo.selectAllPlanningByReccurenceId(id)
}

export async function addSimplePlanning(data) {
    planningRepo.insertNewPlanningWithRecurrence(data)
}

export async function addPlanning(data) {
    const success = []
    const failed = []
    for (let i = 0; i < data.length; i++) {
        const { driver_id, date, client_name, start_time, return_time, note, destination, long_distance, frequency } = data[i];
        const frequencyFormated = toArray(frequency)
        if (frequencyFormated && frequencyFormated.length > 0) {
            try {
                const { recurrence_id, allDays } = createRecurrence(date, frequencyFormated)
                const planningToInsert = { driver_id, client_name, start_time, return_time, note, destination, long_distance, recurrence_id }
                const allDaysData = allDays.map((item) => ({ ...planningToInsert, date: item }))
                planningRepo.insertManyNewPlanningsWithRecurrence(allDaysData)
                success.push({ client_name, recurrence_id })
            } catch (err) {
                failed.push({ driver_id, date, client_name, start_time, return_time, note, destination, long_distance, frequency })
            }
        } else {
            const planningToInsert = { driver_id, date, client_name, start_time, return_time, note, destination, long_distance }
            try {
                const addPlanning = planningRepo.insertNewPlanningWithoutRecurrence(planningToInsert)
                success.push(addPlanning.lastInsertRowid)
            } catch (err) {
                failed.push(planningToInsert)
            }
        }
    }
}

export function handleChangeRecurrence(recurrence_id, date, frequency, data) {
    const newRecurrence = modifyRecurrence(recurrence_id, date, frequency)
    const dataToDelete = newRecurrence.toDelete.map((item) => ({ date: item, recurrence_id: newRecurrence.id }))
    planningRepo.deleteManyPlanningWithDateAndReccurenceId(dataToDelete)
    const dataToInsert = newRecurrence.toAdd.map((item) => ({ ...data, date: item }))
    planningRepo.insertManyNewPlanningsWithRecurrence(dataToInsert)
}

export async function modifyPlanning(data) {
    const { id, driver_id, date, client_name, start_time, return_time, note, destination, long_distance, recurrence_id, frequency } = data
    const dbRecurrenceData = recurrenceRepo.selectWithId(recurrence_id)
    const isBeforeNextDay = parseToDate(date) < parseToDate(dbRecurrenceData.next_day)
    const frequencyChanged = dbRecurrenceData.frequency !== frequency
    const dataForInsertion = { id, driver_id, client_name, start_time, return_time, note, destination, long_distance, recurrence_id }

    if (frequencyChanged && isBeforeNextDay) {
        handleChangeRecurrence(dbRecurrenceData.id, date, frequency, dataForInsertion)
    } else if (frequencyChanged && !isBeforeNextDay) {
        handleChangeRecurrence(dbRecurrenceData.id, dbRecurrenceData.start_date, frequency, dataForInsertion)
    } else {
        planningRepo.updatePlanningWithId({ ...dataForInsertion, date: date })
    }
}

export async function deletePlanning(data) {
    const { id, deleteRecurrence } = data
    const line = planningRepo.selectPlanningById(id)
    if (deleteRecurrence) {
        planningRepo.deletePlanningWithRecurrenceId(line.recurrence_id)
        deleteRecurrence(line.recurrence_id)
    } else if (!deleteRecurrence && line.recurrence_id) {
        createExcludeDays(line.recurrence_id, line.date)
        planningRepo.deletePlanningWithId(id)
    } else {
        planningRepo.deletePlanningWithId(id)
    }
}

export async function checkOldPlanning() {
    const plannings = planningRepo.selectPlanningWithRecurrence()
    for (const planning of plannings) {
        if (isOlderThanToday(planning.date)) {
            planningRepo.updatePlanningWithId({ ...planning, reccurence_id: 0 })
        }
    }
}