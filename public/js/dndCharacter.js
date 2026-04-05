/**
 * @file dndCharacter.js
 * Holds all character data
 * Extends EventTarget to publish changes
 */

import { getRace, getClass, getSubRace, getBackground } from './dndApi.js';
import { DndRace, DndClass, DndSubRace, DndBackground } from './dndModels.js';

export class DndCharacter extends EventTarget {
    constructor(charName, level, dndRace, dndClass) {
        super(); // Call the EventTarget constructor
        
        // Basic properties
        this._playerName = "";
        this._charName = charName || "";
        this._level = level || 1;
        this._race = dndRace || "";
        this._class = dndClass || "";
        this._subRace = "";
        this._background = "";
        this._abilityScores = {
            str: 8, dex: 8, con: 8,
            int: 8, wis: 8, cha: 8,
        };
        this._skillProficiencies = {};

        // Track the individual components for UI persistence
        this._baseAbilityScores = { str: 8, dex: 8, con: 8, int: 8, wis: 8, cha: 8 };
        this._userAbilityBonuses = { str: 0, dex: 0, con: 0, int: 0, wis: 0, cha: 0 };

        // Detailed Data Models
        this._raceDetails = null;
        this._classDetails = null;
        this._subRaceDetails = null;
        this._backgroundDetails = null;
    }

    // --- Getters ---
    get charName() { return this._charName; }
    get level() { return this._level; }
    get dndRace() { return this._race; }
    get dndSubRace() { return this._subRace; }
    get dndClass() { return this._class; }

    get raceDetails() { return this._raceDetails; }
    get classDetails() { return this._classDetails; }
    get subRaceDetails() { return this._subRaceDetails; }

    get baseAbilityScores() { return this._baseAbilityScores; }
    get userAbilityBonuses() { return this._userAbilityBonuses; }
    get abilityScores() { return this._abilityScores; }
    get skillProficiencies() { return this._skillProficiencies; }

    get dndBackground() { return this._background; }
    get backgroundDetails() { return this._backgroundDetails; }

    // --- Setters ---
    set charName(newName) {
        this._charName = newName;
        // Emit an event whenever the character name is changed
        this.dispatchChangeEvent('charName', newName);
    }

    set level(newLevel) {
        this._level = newLevel;
        // Emit an event whenever the character level is changed
        this.dispatchChangeEvent('level', newLevel);
    }

    set dndRace(newRace) {
        this._race = newRace;
        // Emit an event whenever the character race is changed
        this.dispatchChangeEvent('dndRace', newRace);
    }

    set dndSubRace(newSubRace) {
        this._subRace = newSubRace;
        // Emit an event whenever the character sub-race is changed
        this.dispatchChangeEvent('dndSubRace', newSubRace);
    }

    set dndClass(newClass) {
        this._class = newClass;
        // Emit an event whenever the character class is changed
        this.dispatchChangeEvent('dndClass', newClass);
    }

    /**
     * Fetches race details by index, maps to model, and updates the character.
     * @param {string} index - e.g., "dwarf"
     */
    async applyRace(index) {
        if (!index) {
            this._raceDetails = null;
            this.dndRace = ""; // Triggers change event for the string name
            return;
        }
        try {
            const rawData = await getRace(index);
            this._raceDetails = new DndRace(rawData);
            this.dndRace = this._raceDetails.name; 
            this.dispatchChangeEvent('raceDetails', this._raceDetails);
        } catch (error) {
            console.error(`Failed to fetch and apply race details for ${index}:`, error);
        }
    }
    
    /**
     * Fetches class details by index, maps to model, and updates the character.
     * @param {string} index - e.g., "wizard"
     */
    async applyClass(index) {
        if (!index) return;
        try {
            const rawData = await getClass(index);
            this._classDetails = new DndClass(rawData);
            this.dndClass = this._classDetails.name;
            this.dispatchChangeEvent('classDetails', this._classDetails);
        } catch (error) {
            console.error(`Failed to fetch and apply class details for ${index}:`, error);
        }
    }

    /**
     * Fetches sub-race details by index, maps to model, and updates the character.
     * @param {string} index - e.g., "hill-dwarf"
     */
    async applySubRace(index) {
        if (!index) {
            this._subRaceDetails = null;
            this.dndSubRace = ""; 
            return;
        }
        try {
            const rawData = await getSubRace(index);
            this._subRaceDetails = new DndSubRace(rawData);
            this.dndSubRace = this._subRaceDetails.name;
            this.dispatchChangeEvent('subRaceDetails', this._subRaceDetails);
        } catch (error) {
            console.error(`Failed to fetch and apply sub-race details for ${index}:`, error);
        }
    }

    /**
     * A helper method to create and dispatch a custom event.
     * Anyone listening for the 'change' event will be notified.
     */
    dispatchChangeEvent(property, value) {
        const event = new CustomEvent('change', {
            detail: {
                property: property,     // Which property changed
                value: value            // What its new value is
            }
        });
        this.dispatchEvent(event);
    }

    /**
     * Calculates total ability score bonuses from a race and optional subrace.
     * @param {DndRace} raceObj 
     * @param {DndSubRace} [subRaceObj] 
     * @returns {Object} A map of ability scores and their total bonus (e.g., { "str": 2, "con": 1 })
     */
    getCombinedAbilityBonuses(raceObj, subRaceObj = null) {
        const totals = {};

        const applyBonuses = (bonusesArray) => {
            if (!bonusesArray) return;
            for (const bonus of bonusesArray) {
                // Assuming the API returns something like: { ability_score: { index: "str" }, bonus: 2 }
                const stat = bonus.ability_score.index; 
                totals[stat] = (totals[stat] || 0) + bonus.bonus;
            }
        };

        if (raceObj) applyBonuses(raceObj.abilityBonuses);
        if (subRaceObj) applyBonuses(subRaceObj.abilityBonuses);

        return totals;
    }

    /**
     * Fetches background details by index, maps to model, and updates the character.
     */
    async applyBackground(index) {
        if (!index) {
            this._backgroundDetails = null;
            this._background = "";
            this.dispatchChangeEvent('dndBackground', "");
            return;
        }
        try {
            const rawData = await getBackground(index);
            this._backgroundDetails = new DndBackground(rawData);
            
            this._background = this._backgroundDetails.name;
            this.dispatchChangeEvent('dndBackground', this._background);
            this.dispatchChangeEvent('backgroundDetails', this._backgroundDetails);
        } catch (error) {
            console.error(`Failed to fetch and apply background details for ${index}:`, error);
        }
    }
}