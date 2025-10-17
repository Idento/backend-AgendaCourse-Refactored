import * as planningRepo from '../repositories/planningRepository'
import * as recurrenceRepo from '../repositories/recurrenceRepository'
import * as excludedRepo from '../repositories/excludedDaysRepository'
import { generateNextDates } from '../utils/recurrenceUtils'


export function createRecurrence(start_date, weekdays) {
    if (!Array.isArray(weekdays)) throw new Error('weekdays is not an array')
    const nextDays = generateNextDates(start_date, weekdays)
    const insertedRecurrence = recurrenceRepo.insertRecurrence(weekdays, start_date, nextDays[1])
    return { recurrence_id: insertedRecurrence.lastInsertRowid, allDays: nextDays }
}

export function modifyRecurrence(id, start_date, weekDays) {
    if (!Array.isArray(weekDays)) throw new Error('weekdays is not an array')
    const oldData = recurrenceRepo.selectWithId(id)
    const newRecurrence = generateNextDates(start_date, weekDays)
    const oldRecurrence = generateNextDates(oldData.start_date, oldData.frequency)
    const next_day = !newRecurrence.includes(oldData.next_day) ? newRecurrence[1] : oldData.next_day

    recurrenceRepo.updateRecurrenceWithId(weekDays, start_date, next_day, id)

    const toAdd = newRecurrence.filter(d => !oldRecurrence.includes(d))
    const toDelete = oldRecurrence.filter(d => !newRecurrence.includes(d))

    return { id, toAdd, toDelete }
}