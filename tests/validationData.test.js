import { describe, it, expect } from 'vitest'
import { toArray } from '../utils/validationData'

describe('Validation Data', () => {
    it('should convert string or number to Array and if array, return', () => {
        const result = toArray('5')
        const resultTwo = toArray([5])
        const resultThree = toArray('[5]')

        expect(result).toEqual(expect.arrayContaining([5]))
        expect(resultTwo).toEqual(expect.arrayContaining([5]))
        expect(resultThree).toEqual(expect.arrayContaining([5]))
    })
})