/**
 * @file skillsPage.js
 * Handles logic and DOM binding for the Skills page.
 */

import { getAllSkills } from './dndApi.js';
import { DndSkill } from './dndModels.js';

// Cache skills so we don't have to fetch them again if the user clicks Prev/Next
let cachedSkills = null;

/**
 * Calculates D&D 5e Proficiency Bonus based on character level.
 * Math: Math.ceil(level / 4) + 1
 */
function getProficiencyBonus(level) {
    const lvl = parseInt(level, 10) || 1;
    return Math.ceil(lvl / 4) + 1;
}

/**
 * Calculates D&D 5e Ability Score Modifier.
 * Math: Math.floor((score - 10) / 2)
 */
function getAbilityModifier(score) {
    const val = parseInt(score, 10) || 10;
    return Math.floor((val - 10) / 2);
}

/**
 * Formats a number with a leading '+' if it is positive.
 */
function formatModifier(num) {
    return num >= 0 ? `+${num}` : `${num}`;
}

export async function bindSkillsPage(character) {
    // 1. Fetch skills from the API (and map them to our JS models)
    if (!cachedSkills) {
        try {
            const rawSkills = await getAllSkills();
            cachedSkills = rawSkills.map(data => new DndSkill(data));
        } catch (error) {
            console.error("Failed to fetch skills from API:", error);
            return;
        }
    }

    // 2. Calculate and display Proficiency Bonus
    const profBonus = getProficiencyBonus(character.level);
    const profDisplay = document.getElementById('prof-bonus-display');
    if (profDisplay) {
        profDisplay.textContent = formatModifier(profBonus);
    }

    // 3. Determine max allowed choices AND the list of valid class skills
    let maxChoices = 0;
    const allowedSkills = new Set();

    if (character.classDetails && character.classDetails.proficiencyChoices) {
        for (const choice of character.classDetails.proficiencyChoices) {
            if (choice.type === "proficiencies" && choice.from && choice.from.options) {
                
                let isSkillChoice = false;
                for (const opt of choice.from.options) {
                    if (opt.item && opt.item.index && opt.item.index.startsWith('skill-')) {
                        allowedSkills.add(opt.item.index.replace('skill-', ''));
                        isSkillChoice = true;
                    }
                }
                // Only add to maxChoices if this specific choice array was actually for skills
                if (isSkillChoice) {
                    maxChoices += choice.choose;
                }
            }
        }
    }

    // 4. Determine pre-trained skills according to Background
    const backgroundSkills = new Set();
    if (character.backgroundDetails && character.backgroundDetails.startingProficiencies) {
        for (const prof of character.backgroundDetails.startingProficiencies) {
            if (prof.index && prof.index.startsWith('skill-')) {
                backgroundSkills.add(prof.index.replace('skill-', ''));
            }
        }
    }

    // 5. Setup the Choices Remaining tracking
    const choicesContainer = document.getElementById('choices-remaining-container');
    const choicesDisplay = document.getElementById('choices-remaining-display');

    const updateChoicesRemaining = () => {
        if (!choicesDisplay || !choicesContainer) return;

        // Count how many skills the user has checked total
        let totalChecked = 0;
        for (const skill of cachedSkills) {
            // Count trained skills, except those trained through Background
            if (character.skillProficiencies[skill.index] && !backgroundSkills.has(skill.index)) {
                totalChecked++;
            }
        }

        const remaining = maxChoices - totalChecked;
        choicesDisplay.textContent = remaining;

        // Apply visual warning if they drafted too many
        if (remaining < 0) {
            choicesContainer.classList.remove('bg-stone-100', 'border-stone-300', 'text-stone-700');
            choicesContainer.classList.add('bg-red-100', 'border-red-400', 'text-red-700');
        } else {
            choicesContainer.classList.remove('bg-red-100', 'border-red-400', 'text-red-700');
            choicesContainer.classList.add('bg-stone-100', 'border-stone-300', 'text-stone-700');
        }
    };

    // 6. Bind DOM elements and math for each skill
    for (const skill of cachedSkills) {
        const skillId = skill.index; // e.g., "stealth"
        // The API provides the governing stat (e.g., "dex")
        const statKey = skill.abilityScore ? skill.abilityScore.index.toLowerCase() : 'int';

        const checkbox = document.getElementById(`skill-${skillId}`);
        const totalDisplay = document.getElementById(`total-${skillId}`);
        const label = document.querySelector(`label[for="skill-${skillId}"]`);

        if (!checkbox || !totalDisplay) continue;

        // Visual distinction for Background pre-trained skills
        const isBackground = backgroundSkills.has(skillId);
        // Visual distinction for recommended skills vs non-recommended skills
        const isAllowed = allowedSkills.size === 0 || allowedSkills.has(skillId);
        
        // Ensure nothing is disabled so homebrew is supported
        checkbox.disabled = false;

        if (label) {
            // Clear all possible text colors first
            label.classList.remove('text-stone-400', 'text-stone-500', 'text-stone-900', 'text-amber-700', 'font-medium', 'font-bold');

            if (isBackground) {
                // Background skills get a special amber highlighting
                label.classList.add('text-amber-700', 'font-bold');
            }
            if (isAllowed) {
                label.classList.add('text-stone-900', 'font-medium');
            } else {
                // Use a subtle grey for non-class skills
                label.classList.add('text-stone-500'); 
            }
        }

        // Auto-check the box if it is a background skill
        if (isBackground) {
            character.skillProficiencies[skillId] = true;
        }

        // Restore saved checkbox state
        checkbox.checked = !!character.skillProficiencies[skillId];

        // The math calculation
        const updateSkillTotal = () => {
            const statScore = character.abilityScores[statKey] || 10;
            const modifier = getAbilityModifier(statScore);
            const finalTotal = modifier + (checkbox.checked ? profBonus : 0);
            
            totalDisplay.textContent = formatModifier(finalTotal);
            character.skillProficiencies[skillId] = checkbox.checked;

            // Trigger the remaining count to update whenever a box is toggled
            updateChoicesRemaining();
        };

        checkbox.addEventListener('change', updateSkillTotal);
        
        // Initialize math for this skill row
        updateSkillTotal();
    }

    // Run once on load to establish the initial choices remaining number
    updateChoicesRemaining();
}