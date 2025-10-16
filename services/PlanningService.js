import * as planningRepo from '../repositories/planningRepository'
import * as recurrenceRepo from '../repositories/recurrenceRepository'
import { retrieveDate, retrieveDateFromDate, todayDateFormated } from '../utils/dateUtils'
import { generateNextDates, generateNextDatesWithoutExcludeDays } from '../utils/recurrenceUtils'
import { getAllDrivers } from './DriverService'


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

export async function addPlanning() {

}