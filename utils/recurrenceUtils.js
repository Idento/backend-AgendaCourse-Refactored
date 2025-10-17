import { RRule, RRuleSet } from "rrule";
import { addWeeksForReccurence, formatToDate, parseToDate } from "./dateUtils";
import { isSameDay, startOfDay } from "date-fns";
import { toArray } from "./validationData";

const WEEKDAYBYNUMBER = {
    1: RRule.MO,
    2: RRule.TU,
    3: RRule.WE,
    4: RRule.TH,
    5: RRule.FR,
    6: RRule.SA,
    0: RRule.SU
}

export function generateNextDates(startDate, weekDays) {
    if (weekDays.length === 0) return []
    const safeWeekDay = toArray(weekDays)
    const rruleWeekDays = safeWeekDay.map((item) => WEEKDAYBYNUMBER[item])
    const parsedDate = parseToDate(startDate)
    const endOfRecurrence = safeWeekDay.length * 4
    const rule = new RRule({
        freq: RRule.WEEKLY,
        interval: 1,
        byweekday: rruleWeekDays,
        dtstart: parsedDate,
        count: endOfRecurrence
    })
    const dates = rule.all()
    const formatedDates = dates.map(formatToDate)
    return formatedDates
}

export function generateNextDatesWithoutExcludeDays(startDate, weekDays, excluded_days) {
    if (!Array.isArray(excluded_days) || weekDays.length === 0 || excluded_days.length === 0) return []
    const safeWeekDay = toArray(weekDays)
    const rruleWeekDays = safeWeekDay.map((item) => WEEKDAYBYNUMBER[item])
    const parsedDate = parseToDate(startDate)
    const count = safeWeekDay.length * 4
    const rule = new RRule({
        freq: RRule.WEEKLY,
        interval: 1,
        byweekday: rruleWeekDays,
        dtstart: parsedDate,
        count
    })
    const allDates = rule.all()

    const excluded_parse = excluded_days.map(parseToDate)
    const result = allDates.filter(date => !excluded_parse.some(excluded => isSameDay(excluded, date)))
    const formatedResult = result.map(formatToDate);

    return formatedResult
}