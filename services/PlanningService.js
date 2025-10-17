import * as planningRepo from '../repositories/planningRepository'
import * as recurrenceRepo from '../repositories/recurrenceRepository'
import { parseToDate, retrieveDate, retrieveDateFromDate, todayDateFormated } from '../utils/dateUtils'
import { generateNextDates, generateNextDatesWithoutExcludeDays } from '../utils/recurrenceUtils'
import { toArray } from '../utils/validationData'
import { getAllDrivers } from './DriverService'
import { createRecurrence, modifyRecurrence } from './ReccurenceService'


export async function getPlanning(week = false, date = '') {
    const driver = getAllDrivers()
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

export async function addPlanning(data) {
    const success = []
    const failed = []
    for (let i = 0; i < data.length; i++) {
        const { driver_id, date, client_name, start_time, return_time, note, destination, long_distance, frequency } = data[i];
        const frequencyFormated = toArray(frequency)
        if (frequencyFormated && frequencyFormated.length > 0) {
            try {
                const { recurrence_id, allDays } = createRecurrence(date, frequencyFormated)
                for (const recurrenceDate of allDays) {
                    const planningToInsert = { driver_id, recurrenceDate, client_name, start_time, return_time, note, destination, long_distance, recurrence_id }
                    planningRepo.insertNewPlanningWithRecurrence(planningToInsert)
                }
                success.push({ recurrence_id })
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

function handleChangeRecurrence(recurrence_id, date, frequency, data) {
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