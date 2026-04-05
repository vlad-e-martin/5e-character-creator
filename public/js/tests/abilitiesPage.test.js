import { bindAbilitiesPage } from '../abilitiesPage.js';
import { vi } from 'vitest';

describe('Abilities Page DOM Logic & Color', () => {
    let character;

    beforeEach(() => {
        // 1. Manually construct the minimal HTML your JS expects
        document.body.innerHTML = `
            <div id="point-buy-container"></div>
            <div id="point-buy-display"></div>
            <input id="base-str" />
            <div id="racial-str"></div>
            <input id="user-str" />
            <div id="total-str"></div>
            <div id="badge-str-container">
                <span id="cost-str"></span>
            </div>
        `;

        // 2. Mock a character object compatible with your DndCharacter class
        character = {
            baseAbilityScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
            userAbilityBonuses: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
            _abilityScores: {},
            // Racial bonuses should NOT affect point buy
            raceDetails: { abilityBonuses: [{ ability_score: { index: 'str' }, bonus: 2 }] },
            dispatchChangeEvent: vi.fn() // Vitest mock function
        };
    });

    test('updates Strength total when base input changes', () => {
        // Initialize the bindings
        bindAbilitiesPage(character);

        const strInput = document.getElementById('base-str');
        const totalDisplay = document.getElementById('total-str');

        // Simulate user typing '12'
        strInput.value = '12';
        strInput.dispatchEvent(new Event('input'));

        // Verify the logic updated the UI (adding the racial bonus)
        expect(totalDisplay.textContent).toBe('14');
        // Verify the logic updated the character object
        expect(character.baseAbilityScores.str).toBe(12);
    });

    test('badge turns red when score is out of 8-15 bounds', () => {
        // Initialize the bindings
        bindAbilitiesPage(character);

        const strInput = document.getElementById('base-str');
        const badge = document.getElementById('cost-str').parentElement;

        // Change STR to 7 (Under bounds)
        strInput.value = '7';
        strInput.dispatchEvent(new Event('input'));
        expect(badge.classList.contains('bg-red-100')).toBe(true);

        // Change STR to 14 (In bounds)
        strInput.value = '14';
        strInput.dispatchEvent(new Event('input'));
        expect(badge.classList.contains('bg-stone-200')).toBe(true);
        expect(badge.classList.contains('bg-red-100')).toBe(false);
    });

    test('global container turns red if total points exceed 27', () => {
        // 1. Set stats to values totaling 29 points
        character.baseAbilityScores.str = 15; // 9 pts
        character.baseAbilityScores.dex = 15; // 9 pts
        character.baseAbilityScores.con = 15; // 9 pts
        character.baseAbilityScores.int = 10; // 2 pts
        // Total = 29
        
        // 2. Initialize bindings (this runs the initial refreshPointBuyTracker call)
        bindAbilitiesPage(character);

        const container = document.getElementById('point-buy-container');
        const display = document.getElementById('point-buy-display');

        // 3. Assert the container turned red and display updated
        expect(display.textContent).toBe('29 / 27');
        expect(container.classList.contains('bg-red-100')).toBe(true);
        expect(container.classList.contains('text-red-700')).toBe(true);
    });
});