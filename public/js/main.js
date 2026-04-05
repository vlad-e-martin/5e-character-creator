import { DndCharacter } from './dndCharacter.js';

import { bindInitialPageInputs, populateInitialDropdowns } from './initialPage.js';

import { bindAbilitiesPage } from './abilitiesPage.js';

import { bindSkillsPage } from './skillsPage.js';

// This is the "single source of truth" for character data
let character;

// --- STATE MANAGEMENT ---

// Define the pages/stages of creation
const pages = [
    "landing",
    "pages/initial_1.html",
    "pages/abilities_2.html",
    "pages/skills_3.html"
];
let currentPageIndex = 0;

// --- DOM ELEMENTS ---
const contentContainer = document.getElementById('content-container');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');
const btnRestart = document.getElementById('btn-restart');
const btnSave = document.getElementById('btn-save');

// Header summary elements
const summaryPlayer = document.getElementById('summary-player');
const summaryName = document.getElementById('summary-name');
const summaryRace = document.getElementById('summary-race');
const summarySubRace = document.getElementById('summary-subrace');
const summaryClass = document.getElementById('summary-class');
const summaryUpdated = document.getElementById('summary-updated');

// We'll need to re-find these buttons when page 0 is loaded
let btnCreate = document.getElementById('btn-create');
let btnLoad = document.getElementById('btn-load');

// --- NAVIGATION LOGIC ---

/**
 * Loads and displays the content for a specific page index.
 * @param {number} pageIndex - The index of the page to load (from the `pages` array)
 */
async function loadPage(pageIndex) {
    currentPageIndex = pageIndex;
    
    if (pageIndex === 0) {
        // Special case: Load the hardcoded landing page content
        const landingContent = document.getElementById('page-0-content').outerHTML;
        contentContainer.innerHTML = landingContent;
        // Re-bind the create/load buttons since we replaced the HTML
        bindLandingButtons();
    } else {
        // Fetch and load the page content from the HTML file
        try {
            const response = await fetch(pages[pageIndex]);
            if (!response.ok) {
                throw new Error(`Failed to load page: ${response.statusText}`);
            }
            const pageHtml = await response.text();
            contentContainer.innerHTML = pageHtml;
            
            // After loading the page, run any page-specific setup
            await initializePage(pageIndex);

        } catch (error) {
            console.error("Error loading page:", error);
            contentContainer.innerHTML = `<p class="text-red-600 font-bold">Error: Could not load page content.</p>`;
        }
    }
    
    // Always update the navigation button states after a page load
    updateNavButtons();
}

/**
 * Runs page-specific initialization code (e.g., populating dropdowns)
 * @param {number} pageIndex - The index of the page that was just loaded
 */
async function initializePage(pageIndex) {
    switch (pageIndex) {
        case 1:
            console.log("Loaded Initial Character page");
            // 1. Populate the dropdowns with data from the API
            await populateInitialDropdowns();
            // 2. Bind the form inputs to the 'character' object
            bindInitialPageInputs(character);
            break;
        case 2:
            console.log("Loaded Abilities page");
            // Bind the form inputs to the 'character' object
            bindAbilitiesPage(character);
            break;
        case 3:
            console.log("Loaded Skills page");
            // Bind the form inputs to the 'character' object
            await bindSkillsPage(character);
            break;
    }
}

/**
 * Updates the enabled/disabled state of the footer navigation buttons
 */
function updateNavButtons() {
    // Disable all buttons by default if on the landing page
    if (currentPageIndex === 0) {
        btnPrev.disabled = true;
        btnRestart.disabled = true;
        btnSave.disabled = true;
        btnNext.disabled = true;
    } else {
        btnRestart.disabled = false; // Enable restart
        btnSave.disabled = false; // Enable save
        btnPrev.disabled = (currentPageIndex === 1); // Disable on first page
        btnNext.disabled = (currentPageIndex === pages.length - 1); // Disable on last page
    }
}

// --- CHARACTER DATA & UI SYNC ---

/**
 * Updates the top summary banner with data from the character object.
 */
function updateSummaryBanner() {
    if (!character) return; // Do nothing if character hasn't been created

    summaryPlayer.textContent = character.playerName || "N/A";
    summaryName.textContent = character.charName || "N/A";
    summaryRace.textContent = character.dndRace || "N/A";
    summarySubRace.textContent = character.dndSubRace || "N/A";
    summaryClass.textContent = character.dndClass || "N/A";
    
    summaryUpdated.textContent = new Date().toLocaleTimeString();
}

// --- EVENT LISTENERS ---

// Binds listeners to the main "Create" and "Load" buttons
function bindLandingButtons() {
    btnCreate = document.getElementById('btn-create');
    btnLoad = document.getElementById('btn-load');

    if (btnCreate) {
        btnCreate.addEventListener('click', () => {
            // Create a new, blank character object
            character = new DndCharacter();
            
            // Update the summary banner every time the character changes
            character.addEventListener('change', updateSummaryBanner);
            
            // Manually clear the banner for this new character
            updateSummaryBanner(); 

            // Start the creation process by loading page 1
            loadPage(1);
        });
    }
    if (btnLoad) {
        btnLoad.addEventListener('click', () => {
            // Create a hidden file input element
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json'; // Only accept JSON files

            // Listen for when the user selects a file
            fileInput.onchange = (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const reader = new FileReader();
                reader.onload = (event) => {
                    try {
                        const parsedData = JSON.parse(event.target.result);
                        
                        // Instantiate a fresh character and merge the loaded data into it
                        character = new DndCharacter();
                        Object.assign(character, parsedData);
                        
                        character.addEventListener('change', updateSummaryBanner);
                        updateSummaryBanner(); 
                        
                        // Jump right into Step 1 with the loaded data
                        loadPage(1); 
                    } catch (err) {
                        alert("Failed to load character file. Ensure it is a valid JSON file.");
                        console.error(err);
                    }
                };
                
                // Read the file as text
                reader.readAsText(file);
            };
            
            // Trigger the hidden file browser dialog
            fileInput.click();
        });
    }
}

// Footer navigation listeners
btnNext.addEventListener('click', () => {
    if (currentPageIndex < pages.length - 1) {
        loadPage(currentPageIndex + 1);
    }
});

btnPrev.addEventListener('click', () => {
    if (currentPageIndex > 0) {
        // If on page 1, go back to landing (page 0)
        loadPage(currentPageIndex - 1);
    }
});

btnRestart.addEventListener('click', () => {
    if (confirm("Are you sure you want to restart? All unsaved progress will be lost.")) {
        loadPage(0); // Go back to landing page
    }
});

btnSave.addEventListener('click', () => {
    if (!character) return;

    // Convert the character object to a formatted JSON string
    const jsonString = JSON.stringify(character, null, 2);
    
    // Create a Blob containing the JSON
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);

    // Create a safe filename using the character's name (or a default)
    let safeName = (character.charName || "Unnamed_Character").replace(/[^a-z0-9]/gi, '_').toLowerCase();

    // Generate a timestamp like "20260405_152200"
    const now = new Date();
    // toISOString() looks like "2026-04-05T15:22:00.000Z". We split at the period, then remove hyphens, colons, and the 'T'.
    const timestamp = now.toISOString().split('.')[0].replace(/[-:]/g, '').replace('T', '_');
    
    const fileName = `${safeName}_${timestamp}.json`;
    
    // Create a temporary anchor link to trigger the download
    const downloadAnchorNode = document.createElement('a');
    // Create an invisible web link to the Blob URL
    downloadAnchorNode.setAttribute("href", url);
    // Tell the browser to trigger a file download when the URL is clicked
    downloadAnchorNode.setAttribute("download", fileName);
    document.body.appendChild(downloadAnchorNode); // Required for Firefox
    // Programmatically click on the Blob URL to trigger a file download
    downloadAnchorNode.click();
    // Remove the download web link now that the file has been downloaded
    downloadAnchorNode.remove();
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
})

// --- INITIALIZATION ---

// Set the initial state of the app on load
document.addEventListener('DOMContentLoaded', () => {
    bindLandingButtons(); // Bind buttons on page 0
    updateNavButtons();   // Set initial footer button state
});