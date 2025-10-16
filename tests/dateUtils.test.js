import { describe, it, expect } from 'vitest'
import { formatToDate, isOld, parseToDate } from '../utils/dateUtils'

describe('Dates comparaison', () => {
    it('should be true if a date is 30 days older', () => {
        const result = isOld('05/09/2025')
        expect(result).toBeTruthy()
    })
    it('should be false if a date is less than 30 days older', () => {
        const result = isOld(formatToDate(new Date()))
        expect(result).toBeFalsy()
    })
})

describe('Convert Dates', () => {
    it('should convert a date to string', () => {
        const result = formatToDate(new Date())
        expect(typeof result).toBe('string')
    })
    it('should convert a string to a date', () => {
        const result = parseToDate('16/10/2025')
        expect(result instanceof Date).toBeTruthy()
    })
})