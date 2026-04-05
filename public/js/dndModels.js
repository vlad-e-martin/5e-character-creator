/**
 * Represents a reference item (like a specific skill or tool) inside a proficiency choice.
 */
export class DndReferenceOption {
    constructor(data) {
        if (!data) data = {};
        this.optionType = data.option_type || "";
        // item usually contains { index: "...", name: "...", url: "..." }
        this.item = data.item || null; 
    }
}

/**
 * Represents the set of options a player can choose from.
 */
export class DndProficiencyOptionSet {
    constructor(data) {
        if (!data) data = {};
        this.optionSetType = data.option_set_type || "";
        this.options = (data.options || []).map(opt => new DndReferenceOption(opt));
    }
}

/**
 * Represents a choice the player gets to make (e.g., "Choose 2 from Acrobatics, Athletics...").
 */
export class DndProficiencyChoice {
    constructor(data) {
        if (!data) data = {};
        this.desc = data.desc || "";
        this.choose = data.choose || 0;
        this.type = data.type || "";
        this.from = data.from ? new DndProficiencyOptionSet(data.from) : null;
    }
}

/**
 * @file dndModels.js
 * Mirrors the Go backend data structures.
 */

export class DndClass {
    constructor(data) {
        if (!data) data = {};
        this.index = data.index || "";
        this.name = data.name || "";
        this.hitDie = data.hit_die || 0;
        this.savingThrows = data.saving_throws || [];
        this.subClasses = data.subclasses || [];
        
        // Map the proficiency choices
        this.proficiencyChoices = (data.proficiency_choices || []).map(
            choice => new DndProficiencyChoice(choice)
        );
        
        this.url = data.url || "";
        this.updatedAt = data.updated_at || "";
    }
}

export class DndRace {
    constructor(data) {
        this.index = data.index || "";
        this.name = data.name || "";
        this.speed = data.speed || 0;
        this.abilityBonuses = data.ability_bonuses || [];
        this.alignmentDesc = data.alignment || "";
        this.ageDesc = data.age || "";
        this.size = data.size || "";
        this.sizeDesc = data.size_description || "";
        this.languages = data.languages || [];
        this.languageDesc = data.language_desc || "";
        this.traits = data.traits || [];
        this.subRaces = data.subraces || [];
        this.url = data.url || "";
        this.updatedAt = data.updated_at || "";
    }
}

/**
 * Represents the nested parent race object returned within a sub-race.
 */
export class DndParentRace {
    constructor(data) {
        if (!data) data = {};
        this.index = data.index || "";
        this.name = data.name || "";
        this.url = data.url || "";
        this.updatedAt = data.updated_at || "";
    }
}

/**
 * Represents a sub-race.
 */
export class DndSubRace {
    constructor(data) {
        if (!data) data = {};
        this.index = data.index || "";
        this.name = data.name || "";
        // Map the nested object to the DndParentRace class
        this.race = data.race ? new DndParentRace(data.race) : null; 
        this.desc = data.desc || "";
        this.abilityBonuses = data.ability_bonuses || [];
        this.racialTraits = data.racial_traits || [];
        this.url = data.url || "";
        this.updatedAt = data.updated_at || "";
    }
}

/**
 * Represents a single D&D Skill and its associated ability score.
 */
export class DndSkill {
    constructor(data) {
        if (!data) data = {};
        this.index = data.index || "";
        this.name = data.name || "";
        this.desc = data.desc || [];
        this.abilityScore = data.ability_score || null;
        this.url = data.url || "";
        this.updatedAt = data.updated_at || "";
    }
}

/**
 * Represent a single D&D Background and its associated starting skill proficiencies
 */
export class DndBackground {
    constructor(data) {
        if (!data) data = {};
        this.index = data.index || "";
        this.name = data.name || "";
        this.startingProficiencies = data.starting_proficiencies || [];
    }
}