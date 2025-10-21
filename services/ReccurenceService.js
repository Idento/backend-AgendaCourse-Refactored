import * as recurrenceRepo from '../repositories/recurrenceRepository.js'
import * as excludedRepo from '../repositories/excludedDaysRepository.js'
import { generateNextDates } from '../utils/recurrenceUtils.js'
import { formatToDate, isOlderThanToday } from '../utils/dateUtils.js'
import { addSimplePlanning, getDataPlanningForReccurenceCheck } from './PlanningService.js'
import { toArray } from '../utils/validationData.js'
import { selectAllPlanningByRecurrenceId } from '../repositories/planningRepository.js'


export function createRecurrence(start_date, weekdays) {
    const frequency = toArray(weekdays)
    if (!Array.isArray(frequency)) throw new Error('weekdays is not an array')
    const nextDays = generateNextDates(start_date, frequency)
    const insertedRecurrence = recurrenceRepo.insertRecurrence(JSON.stringify(frequency), start_date, start_date === nextDays[0] ? nextDays[1] : nextDays[0])
    return { recurrence_id: insertedRecurrence.lastInsertRowid, allDays: nextDays }
}

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

export function modifyRecurrence(id, start_date, weekDays) {
    const frequency = toArray(weekDays)
    if (!Array.isArray(frequency)) throw new Error('weekdays is not an array')
    const oldData = recurrenceRepo.selectWithId(id)
    const newRecurrence = generateNextDates(start_date, weekDays)
    const oldRecurrence = generateNextDates(oldData.start_date, oldData.frequency)
    const excludedRow = excludedRepo.selectExcludedWithRecurrenceId(id)
    const excludedDates = excludedRow?.date || '[]'
    const datesToExclude = toArray(excludedDates)
    console.log(datesToExclude);

    const toAdd = newRecurrence.filter(d => !oldRecurrence.includes(d) && !datesToExclude.includes(d))
    const toDelete = oldRecurrence.filter(d => !newRecurrence.includes(d))

    const filterToCalculateNextDay = newRecurrence.filter(d => !datesToExclude.includes(d))
    console.log(filterToCalculateNextDay);
    const next_day = start_date === filterToCalculateNextDay[0] ? filterToCalculateNextDay[1] : filterToCalculateNextDay[0];
    recurrenceRepo.updateRecurrenceWithId({ frequency: JSON.stringify(weekDays), start_date, next_day, id })

    return { id, toAdd, toDelete }
}

export function deleteRecurrenceService(id) {
    recurrenceRepo.deleteRecurrenceWithId(id)
    excludedRepo.deleteExcludedWithReccurenceId(id)
}

export function checkRecurrenceStartDates() {
    const allRecurrence = recurrenceRepo.selectAll()
    for (const recurrence of allRecurrence) {
        const dataPlanning = getDataPlanningForReccurenceCheck(recurrence.id)
        if (isOlderThanToday(recurrence.start_date)) {
            if (!dataPlanning) throw new Error('No Data Found for update recurrence')
            const { id, toAdd, toDelete } = modifyRecurrence(recurrence.id, recurrence.next_day, recurrence.frequency)
            for (const add of toAdd) {
                const data = { ...dataPlanning, date: add }
                addSimplePlanning(data)
            }
        }
    }
}

