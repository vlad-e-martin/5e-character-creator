import { bindAbilitiesPage } from '../abilitiesPage.js';
import { vi } from 'vitest';

describe('refreshPointBuyTracker() Global Logic', () => {
    let character;

    beforeEach(() => {
        // Set up DOM elements with the IDs expected by abilitiesPage.js
        document.body.innerHTML = `
            <div id="point-buy-container" class="bg-stone-100">
                <span id="point-buy-display">0 / 27</span>
            </div>
            ${['str', 'dex', 'con', 'int', 'wis', 'cha'].map(s => `
                <input id="base-${s}" value="8">
                <input id="user-${s}" value="0">
                <div id="racial-${s}">0</div>
                <div id="total-${s}">8</div>
                <div id="badge-${s}"><span id="cost-${s}">0</span></div>
            `).join('')}
        `;
    
        // Ensure character object uses the keys the script expects
        character = {
            baseAbilityScores: { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 },
            userAbilityBonuses: { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 },
            _abilityScores: {},
            raceDetails: { 
                abilityBonuses: [{ ability_score: { index: 'str' }, bonus: 2 }] 
            },
            subRaceDetails: null,
            dispatchChangeEvent: vi.fn()
        };
    });

    test('starts at 0 points for a default character (all 8s)', () => {
        bindAbilitiesPage(character);
        
        const display = document.getElementById('point-buy-display');
        // Point buy cost for 8 is 0
        expect(display.textContent).toBe("0 / 27");
    });

    test('adding 2 points to different stats yields identical point costs', () => {
        const display = document.getElementById('point-buy-display');

        // Scenario A: Base STR 10 (+2 points)
        character.baseAbilityScores.str = 10;
        bindAbilitiesPage(character);
        expect(display.textContent).toBe("2 / 27");
        
        // Scenario B: Base DEX 10 (+2 points)
        // Reset STR, move points to DEX
        character.baseAbilityScores.str = 8;
        character.baseAbilityScores.dex = 10;
        bindAbilitiesPage(character);
        expect(display.textContent).toBe("2 / 27");
    });

    test('racial bonuses do not impact point buy cost', () => {
        // Base STR is 8, but Race gives +2 (Total 10).
        // The script calculates point buy based strictly on Base + Misc (ignoring Racial)
        character.baseAbilityScores.str = 8;
        
        bindAbilitiesPage(character);

        const costBadge = document.getElementById('cost-str');
        const totalDisplay = document.getElementById('total-str');

        // Total in UI should be 10 (8 base + 2 racial)
        expect(totalDisplay.textContent).toBe("10");
        // But point cost remains 0 because base is still 8
        expect(costBadge.textContent).toBe("0");
    });
});