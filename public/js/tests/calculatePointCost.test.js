import { calculatePointCost } from '../abilitiesPage.js';

describe('calculatePointCost() Logic', () => {
    test('outputs scale monotonically (never decreases as input increases)', () => {
        for (let i = 1; i < 25; i++) {
            expect(calculatePointCost(i + 1)).toBeGreaterThanOrEqual(calculatePointCost(i));
        }
    });

    test('is non-negative for inputs >= 8', () => {
        expect(calculatePointCost(8)).toBe(0);
        expect(calculatePointCost(15)).toBe(9);
        expect(calculatePointCost(20)).toBeGreaterThan(9);
    });

    test('returns negative "refunds" for scores below 8', () => {
        expect(calculatePointCost(7)).toBe(-1);
        expect(calculatePointCost(5)).toBe(-3);
    });

    test('applies homebrew scaling for scores above 15', () => {
        // 15 is 9 points. 16 (+3) = 12. 17 (+3) = 15. 18 (+4) = 19.
        expect(calculatePointCost(16)).toBe(12);
        expect(calculatePointCost(18)).toBe(19);
    });
});