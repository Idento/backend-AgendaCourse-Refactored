import { parse, format, startOfDay, addWeeks, isEqual, differenceInDays, isBefore } from 'date-fns';
import { fr } from 'date-fns/locale';

// Parser une date selon un format spécifique
export function parseToDate(date) {
    return parse(date, 'dd/MM/yyyy', new Date(), { locale: fr })
}

// Fomrater la date selon un format spécifique
export function formatToDate(date) {
    return format(date, 'dd/MM/yyyy', { locale: fr })
}

export function todayDateFormated() {
    const today = new Date()
    return formatToDate(today)
}

// Savoir si la date passer en argument correspond avec celle d'aujourd'hui
export function isToday(date) {
    const parsed = startOfDay(parseToDate(date))
    return isEqual(startOfDay(new Date()), parsed)
}

export function isOlderThanToday(date) {
    const parsed = startOfDay(parseToDate(date))
    return isBefore(parsed, new Date())
}

// Savoir si la date passer en argument est supérieur de 30 jours
export function isOld(date) {
    const valueOfDifference = differenceInDays(new Date(), parseToDate(date))
    return valueOfDifference > 30
}

export function retrieveDate() {
    const week = 8
    let allWeekDays = []
    for (let i = 1; i < week; i++) {
        allWeekDays.push(formatToDate(addDays(new Date(), i), 'dd/MM/yyyy'))
    }
    return allWeekDays
}

export function retrieveDateFromDate(date) {
    const week = 7
    let allWeekDays = []
    for (let i = 0; i < week; i++) {
        allWeekDays.push(formatToDate(addDays(parse(date, 'dd/MM/yyyy', new Date()), i)))
    }
    return allWeekDays
}