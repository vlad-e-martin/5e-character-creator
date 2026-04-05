/**
 * @file abilitiesPage.js
 * Handles the logic and DOM binding for the Ability Scores page.
 */

const STATS = ['str', 'dex', 'con', 'int', 'wis', 'cha'];

// Standard Point Buy Costs table
// See official table: https://www.dndbeyond.com/sources/dnd/basic-rules-2014/step-by-step-characters#AbilityScorePointCost
const POINT_BUY_COSTS = {
    8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9
};

/**
 * Retrieves the point cost for a given ability score.
 * Extrapolates costs for homebrew scores outside the standard 8-15 bounds.
 */
function calculatePointCost(score) {
    if (score < 8) {
        // Refund 1 point per level below 8
        return score - 8; 
    }
    if (score > 15) {
        // Homebrew scaling: progressively more expensive above 15
        let cost = 9;
        let current = 15;
        while (current < score) {
            current++;
            if (current <= 17) cost += 3;
            else if (current <= 19) cost += 4;
            else cost += 5;
        }
        return cost;
    }
    // Return standard table cost
    return POINT_BUY_COSTS[score];
}

/**
 * Calculates combined ability bonuses from the character's race and subrace details.
 * @param {object} character - The DndCharacter instance
 * @returns {object} A mapping of stats to their total racial bonus (e.g., { str: 2, con: 1 })
 */
function calculateRacialBonuses(character) {
    const totals = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };

    const applyBonuses = (bonusesArray) => {
        if (!bonusesArray) return;
        for (const bonus of bonusesArray) {
            // The Go API returns { ability_score: { index: "str" }, bonus: 2 }
            if (bonus.ability_score && bonus.ability_score.index) {
                const stat = bonus.ability_score.index.toLowerCase(); 
                if (totals[stat] !== undefined) {
                    totals[stat] += bonus.bonus;
                }
            }
        }
    };

    if (character.raceDetails) applyBonuses(character.raceDetails.abilityBonuses);
    if (character.subRaceDetails) applyBonuses(character.subRaceDetails.abilityBonuses);

    return totals;
}

/**
 * Finds inputs on Page 2 and binds them to the character's stats.
 * @param {object} character - The DndCharacter instance
 */
export function bindAbilitiesPage(character) {
    // 1. Calculate the innate bonuses provided by Race/SubRace selections from Page 1
    const racialBonuses = calculateRacialBonuses(character);
    const pointBuyContainer = document.getElementById('point-buy-container');
    const pointBuyDisplay = document.getElementById('point-buy-display');

    // A function to sum up and display the global point buy tracker
    const refreshPointBuyTracker = () => {
        let totalPointsUsed = 0;
        let isHomebrew = false;

        STATS.forEach(stat => {
            // Point buy is based strictly on Base + Misc (ignoring Racial)
            const preRacialScore = (character.baseAbilityScores[stat] || 0) + (character.userAbilityBonuses[stat] || 0);
            
            // 1. Calculate the cost for this specific stat
            const individualCost = calculatePointCost(preRacialScore);
            totalPointsUsed += individualCost;

            // 2. Update the individual badge UI on the stat card
            const costDisplay = document.getElementById(`cost-${stat}`);
            if (costDisplay) {
                costDisplay.textContent = individualCost;
                
                // Color the individual badge red if it exceeds standard bounds
                const badgeContainer = costDisplay.parentElement;
                if (preRacialScore < 8 || preRacialScore > 15) {
                    badgeContainer.classList.remove('bg-stone-200', 'text-stone-500', 'border-stone-300');
                    badgeContainer.classList.add('bg-red-100', 'text-red-700', 'border-red-400');
                } else {
                    badgeContainer.classList.remove('bg-red-100', 'text-red-700', 'border-red-400');
                    badgeContainer.classList.add('bg-stone-200', 'text-stone-500', 'border-stone-300');
                }
            }

            // 3. Flag global homebrew rule breaker
            if (preRacialScore < 8 || preRacialScore > 15) {
                isHomebrew = true;
            }
        });

        // Update the global total
        if (pointBuyDisplay) {
            pointBuyDisplay.textContent = `${totalPointsUsed} / 27`;
        }

        // Highlight global badge in red if exceeding 27 points OR using out-of-bounds numbers
        if (pointBuyContainer) {
            if (totalPointsUsed > 27 || isHomebrew) {
                pointBuyContainer.classList.remove('bg-stone-100', 'border-stone-300', 'text-stone-700');
                pointBuyContainer.classList.add('bg-red-100', 'border-red-400', 'text-red-700');
            } else {
                pointBuyContainer.classList.remove('bg-red-100', 'border-red-400', 'text-red-700');
                pointBuyContainer.classList.add('bg-stone-100', 'border-stone-300', 'text-stone-700');
            }
        }
    };
    
    // 2. We iterate over each stat to set up event listeners and default values
    STATS.forEach(stat => {
        const baseInput = document.getElementById(`base-${stat}`);
        const racialDisplay = document.getElementById(`racial-${stat}`);
        const userInput = document.getElementById(`user-${stat}`);
        const totalDisplay = document.getElementById(`total-${stat}`);

        if (!baseInput || !racialDisplay || !userInput || !totalDisplay) return;

        // Set the non-editable racial bonus text
        const racialVal = racialBonuses[stat] || 0;
        racialDisplay.textContent = racialVal;

        // Restore the saved state from the character object
        baseInput.value = character.baseAbilityScores[stat] !== undefined ? character.baseAbilityScores[stat] : 8;
        userInput.value = character.userAbilityBonuses[stat] !== undefined ? character.userAbilityBonuses[stat] : 0;

        // Function to compute total and push it to the character object
        const updateTotal = () => {
            const baseVal = parseInt(baseInput.value, 10) || 0;
            const userVal = parseInt(userInput.value, 10) || 0;
            const finalTotal = baseVal + racialVal + userVal;

            // Update UI
            totalDisplay.textContent = finalTotal;

            // Save the separate parts back to the character
            character.baseAbilityScores[stat] = baseVal;
            character.userAbilityBonuses[stat] = userVal;

            // Save the total 
            character._abilityScores[stat] = finalTotal;

            // Refresh global points whenever a single input changes
            refreshPointBuyTracker();
                
            // Allow other parts of the app to react to the ability score changing
            character.dispatchChangeEvent(`ability_${stat}`, finalTotal);
        };

        // Setup event listeners for user-editable fields for real-time feedback when the user types
        baseInput.addEventListener('input', updateTotal);
        userInput.addEventListener('input', updateTotal);

        // Run the calculation once on load to establish baseline Totals
        updateTotal();
    });

    // Run the initial point buy math on page load
    refreshPointBuyTracker();
}