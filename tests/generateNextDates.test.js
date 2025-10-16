import { describe, it, expect } from 'vitest'
import { generateNextDates, generateNextDatesWithoutExcludeDays } from '../utils/recurrenceUtils'

describe('generateNextDates', () => {
    it('devrai générer les dates sur 4 semaines pour les jours spécifié', () => {
        const result = generateNextDates('15/10/2025', [1, 2, 3])

        expect(result.length).toBe(12)

        expect(result[0].getDate()).toBe(15)
    })
    it('devrait renvoyer un tableau vide si weekDays est vide', () => {
        const result = generateNextDates('15/10/2025', [])
        expect(result).toEqual([])
    })
})

describe('generateNextDatesWithoutExcludedDays', () => {
    it('devrai générer les dates sur 4 semaines pour les jours spécifié mais sans certains jours', () => {
        const result = generateNextDatesWithoutExcludeDays('14/10/2025', [1, 2, 3], ['21/10/2025'])

        expect(result.length).toBe(11)

        expect(result[3].toString()).toBe('22/10/2025')
    })
    it('devrait renvoyer un tableau vide si weekDays est vide', () => {
        const result = generateNextDatesWithoutExcludeDays('15/10/2025', [1, 2, 3], [])
        expect(result).toEqual([])
    })
})