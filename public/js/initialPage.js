import { getAllRaces, getAllClasses, getAllBackgrounds } from './dndApi.js';
import { DndRace, DndClass, DndBackground } from './dndModels.js';

// These hold persistent instances of Dnd* objects
export let allRaceDetails = [];
export let allClassDetails = [];
export let allBackgroundDetails = [];

/**
 * Helper to select a dropdown option by its visible text content.
 * @param {HTMLSelectElement} selectElement
 * @param {string} textToFind
 */
function selectDropdownByText(selectElement, textToFind) {
    if (!selectElement || !textToFind) return;
    for (let i = 0; i < selectElement.options.length; i++) {
        if (selectElement.options[i].text === textToFind) {
            selectElement.selectedIndex = i;
            break;
        }
    }
}

/**
 * Finds all inputs on Page 1 and binds them to the `character` object.
 */
export function bindInitialPageInputs(character) {
    // Find the inputs
    const playerNameInput = document.getElementById('player-name');
    const charNameInput = document.getElementById('char-name');
    const levelSelect = document.getElementById('level-select');
    const raceSelect = document.getElementById('race-select');
    const classSelect = document.getElementById('class-select');
    const subRaceSelect = document.getElementById('subrace-select');
    const backgroundSelect = document.getElementById('background-select');

    // Add event listeners
    // 'input' fires immediately. 'change' fires when unfocused.
    playerNameInput.addEventListener('input', (event) => {
        character.playerName = event.target.value;
    });
    
    charNameInput.addEventListener('input', (event) => {
        character.charName = event.target.value;
    });

    levelSelect.addEventListener('change', (event) => {
        const selectedText = event.target.options[event.target.selectedIndex].text;
        character.level = parseInt(selectedText, 10);
    });

    raceSelect.addEventListener('change', async (event) => {
        // Find the selected option to get its text
        const selectedValue = event.target.value; // Grab the index directly
        
        // Clear sub-race immediately
        await character.applySubRace(""); 

        // Fetch and apply the new full race object
        await character.applyRace(selectedValue);
        
        // Populate the sub-race dropdown using the newly fetched character.raceDetails
        if (character.raceDetails) {
            // Check for both casing styles just in case the JS models differ
            const availableSubRaces = character.raceDetails.subRaces || character.raceDetails.subraces;

            if (availableSubRaces && availableSubRaces.length > 0) {
                populateDropdown(subRaceSelect, availableSubRaces, "Select a subrace");
                subRaceSelect.disabled = false;
            } else {
                populateDropdown(subRaceSelect, [], "N/A (No sub-races)");
                subRaceSelect.disabled = true;
            }
        }
    });

    classSelect.addEventListener('change', async (event) => {
        // Grab the 'value' (the API index) directly from the select element
        const selectedValue = event.target.value; 

        // Fetch and apply the full class object
        await character.applyClass(selectedValue);
    });
    
    subRaceSelect.addEventListener('change', async (event) => {
        // Grab the 'value' (the API index) directly from the select element
        const selectedValue = event.target.value; 

        // Fetch and apply the full sub-race object
        await character.applySubRace(selectedValue);
    });

    backgroundSelect.addEventListener('change', async (event) => {
        const selectedValue = event.target.value; 

        // Fetch and apply the full background object
        await character.applyBackground(selectedValue);
    });

    // --- Also, populate inputs from character object ---
    // This ensures if we go "Prev" and "Next", the values are repopulated.
    playerNameInput.value = character.playerName || "";
    charNameInput.value = character.charName || "";
    // We select the dropdown based on the stored *name*, not the index
    selectDropdownByText(raceSelect, character.dndRace);
    selectDropdownByText(classSelect, character.dndClass);
    // character.level is a number, but dropdown text is a string. 
    // This ensures "1" === "1" and correctly re-selects their level.
    selectDropdownByText(levelSelect, String(character.level));
    selectDropdownByText(backgroundSelect, character.dndBackground);

    // Rebuild the sub-race dropdown using the stored character state
    if (character.raceDetails) {
        const availableSubRaces = character.raceDetails.subRaces || character.raceDetails.subraces; 
        
        if (availableSubRaces && availableSubRaces.length > 0) {
            populateDropdown(subRaceSelect, availableSubRaces, "Select a subrace");
            subRaceSelect.disabled = false;
            // Pre-select their chosen sub-race
            selectDropdownByText(subRaceSelect, character.dndSubRace);
        } else {
            populateDropdown(subRaceSelect, [], "N/A (No sub-races)");
            subRaceSelect.disabled = true;
        }
    } else {
        // No race selected, so disable sub-race
        populateDropdown(subRaceSelect, [], "Select a race first");
        subRaceSelect.disabled = true;
    }
}

/**
 * Fill a <select> element with options.
 * @param {HTMLSelectElement} selectElement
 * @param {Array<object>} items - List of items with 'index' and 'name'
 * @param {string} defaultText - Default placeholder text
 */
function populateDropdown(selectElement, items, defaultText) {
    if (!selectElement) return;
    selectElement.innerHTML = ''; // Clear
    
    // Default disabled option
    const defaultOption = document.createElement('option');
    defaultOption.value = "";
    defaultOption.textContent = `--- ${defaultText} ---`;
    defaultOption.disabled = true;
    defaultOption.selected = true;
    selectElement.appendChild(defaultOption);

    // Add all items
    for (const item of items) {
        const option = document.createElement('option');
        option.value = item.index;
        option.textContent = item.name;
        selectElement.appendChild(option);
    }
}

/**
 * Populates the Race, Class, and Sub-Race dropdowns on page 1.
 */
export async function populateInitialDropdowns() {
    console.log("Populating dropdowns for initial page...");
    const raceSelect = document.getElementById('race-select');
    const subRaceSelect = document.getElementById('subrace-select');
    const classSelect = document.getElementById('class-select');
    const backgroundSelect = document.getElementById('background-select');

    // Set all to loading
    if (raceSelect) raceSelect.innerHTML = '<option>Loading races...</option>';
    if (subRaceSelect) subRaceSelect.innerHTML = '<option>N/A</option>';
    if (classSelect) classSelect.innerHTML = '<option>Loading classes...</option>';
    if (backgroundSelect) backgroundSelect.innerHTML = '<option>Loading backgrounds...</option>';
    
    try {
        // Fetch raw JSON data in parallel
        const [rawRaceDetails, rawClassDetails, rawBackgroundDetails] = await Promise.all([
            getAllRaces(),
            getAllClasses(),
            getAllBackgrounds()
        ]);

        // Map the raw JSON to JS Classes
        allRaceDetails = rawRaceDetails.map(raceData => new DndRace(raceData));
        allClassDetails = rawClassDetails.map(classData => new DndClass(classData));
        allBackgroundDetails = rawBackgroundDetails.map(backgroundData => new DndBackground(backgroundData));

        // Populate dropdowns
        populateDropdown(raceSelect, allRaceDetails, "Select a race");        
        populateDropdown(classSelect, allClassDetails, "Select a class");
        populateDropdown(backgroundSelect, allBackgroundDetails, "Select a background");

    } catch (error) {
        console.error("Failed to populate dropdowns:", error);
        if (raceSelect) raceSelect.innerHTML = '<option>Error loading races</option>';
        if (classSelect) classSelect.innerHTML = '<option>Error loading classes</option>';
        if (backgroundSelect) backgroundSelect.innerHTML = '<option>Error loading backgrounds</option>';
    }
}