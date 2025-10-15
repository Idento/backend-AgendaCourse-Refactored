import { parse, format, startOfDay, addWeeks, isEqual, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

// Parser une date selon un format spécifique
export function parseToDate(date) {
    return parse(date, 'dd/MM/yyyy', new Date(), { locale: fr })
}

// Fomrater la date selon un format spécifique
export function formatToDate(date) {
    return format(date, 'dd/MM/yyyy', { locale: fr })
}

// Savoir si la date passer en argument correspond avec celle d'aujourd'hui
export function isToday(date) {
    const parsed = startOfDay(parseToDate(date))
    return isEqual(startOfDay(new Date()), parsed)
}

// Savoir si la date passer en argument est supérieur de 30 jours
export function isOld(date) {
    const valueOfDifference = differenceInDays(new Date(), parseToDate(date))
    return valueOfDifference > 30
}