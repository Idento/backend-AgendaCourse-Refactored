import * as recurrenceRepo from '../repositories/recurrenceRepository'
import * as excludedRepo from '../repositories/excludedDaysRepository'
import { generateNextDates } from '../utils/recurrenceUtils'
import { isOlderThanToday } from '../utils/dateUtils'
import { addSimplePlanning, getDataPlanningForReccurenceCheck, handleChangeRecurrence } from './PlanningService'


export function createRecurrence(start_date, weekdays) {
    if (!Array.isArray(weekdays)) throw new Error('weekdays is not an array')
    const nextDays = generateNextDates(start_date, weekdays)
    const insertedRecurrence = recurrenceRepo.insertRecurrence(weekdays, start_date, nextDays[1])
    return { recurrence_id: insertedRecurrence.lastInsertRowid, allDays: nextDays }
}

export function createExcludeDays(reccurence_id, date) {
    const exists = excludedRepo.selectExcludedWithRecurrenceId(reccurence_id)
    if (!exists) {
        excludedRepo.insertExcluded(reccurence_id, JSON.stringify([date]))
    } else {
        const dates = JSON.parse(exists.date)
        const newDates = [...dates, date]
        excludedRepo.updateExcludedDateWithRecurrenceId(reccurence_id, JSON.stringify(newDates))
    }
}

export function modifyRecurrence(id, start_date, weekDays) {
    if (!Array.isArray(weekDays)) throw new Error('weekdays is not an array')
    const oldData = recurrenceRepo.selectWithId(id)
    const newRecurrence = generateNextDates(start_date, weekDays)
    const oldRecurrence = generateNextDates(oldData.start_date, oldData.frequency)
    const next_day = !newRecurrence.includes(oldData.next_day) ? newRecurrence[1] : oldData.next_day
    const excludedDates = excludedRepo.selectExcludedWithRecurrenceId(id)
    const datesToExclude = JSON.parse(excludedDates.date)

    recurrenceRepo.updateRecurrenceWithId(weekDays, start_date, next_day, id)

    const toAdd = newRecurrence.filter(d => !oldRecurrence.includes(d) && !datesToExclude.includes(d))
    const toDelete = oldRecurrence.filter(d => !newRecurrence.includes(d))

    return { id, toAdd, toDelete }
}

export function deleteRecurrence(id) {
    recurrenceRepo.deleteRecurrenceWithId(id)
    excludedRepo.deleteExcludedWithReccurenceId(id)
}

export function checkRecurrenceStartDates() {
    const allRecurrence = recurrenceRepo.selectAll()
    for (const recurrence of allRecurrence) {
        const dataPlanning = getDataPlanningForReccurenceCheck(recurrence.id)
        if (isOlderThanToday(recurrence.start_date)) {
            const { id, toAdd, toDelete } = modifyRecurrence(recurrence.id, recurrence.next_day, recurrence.frequency)
            for (const add of toAdd) {
                const data = { ...dataPlanning, date: add }
                addSimplePlanning(data)
            }
        }
    }
}