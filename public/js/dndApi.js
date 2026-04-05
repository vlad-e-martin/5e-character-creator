/**
 * @file dndApi.js
 * * Provides a simple JavaScript module to interact with the
 * * Go backend, wrapping the HTTP fetch calls into JS functions.
 */

/**
 * Handler to interact with the Go service.
 * @param {string} url - The API endpoint to call (e.g., "/api/races")
 * @returns {Promise<any>} A promise that resolves with the JSON response data.
 * @throws {Error} Throws an error if the network response is not ok.
 */
async function fetchFromApi(url) {
    try {
        const response = await fetch(url);

        if (!response.ok) {
            // Get text from the error response body
            const errorText = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorText}`);
        }

        return await response.json();

    } catch (error) {
        console.error(`Failed to fetch from ${url}:`, error);
        // Re-throw the error so the calling function can handle it
        throw error;
    }
}

// --- Races ---

/**
 * Fetches a list of all D&D races.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of race objects.
 */
export function getAllRaces() {
    return fetchFromApi("/api/races/");
}

/**
 * Fetches the details for a single race by its index.
 * @param {string} index - The index of the race (e.g., "dwarf")
 * @returns {Promise<object>} A promise that resolves to a single race object.
 */
export function getRace(index) {
    return fetchFromApi(`/api/races/${index}`);
}

// --- Classes ---

/**
 * Fetches a list of all D&D classes.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of class objects.
 */
export function getAllClasses() {
    return fetchFromApi("/api/classes/");
}

/**
 * Fetches the details for a single class by its index.
 * @param {string} index - The index of the class (e.g., "wizard")
 * @returns {Promise<object>} A promise that resolves to a single class object.
 */
export function getClass(index) {
    return fetchFromApi(`/api/classes/${index}`);
}

// --- Sub-Races ---

/**
 * Fetches a list of all D&D sub-races.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of sub-race objects.
 */
export function getAllSubRaces() {
    return fetchFromApi("/api/subraces/");
}

/**
 * Fetches the details for a single sub-race by its index.
 * @param {string} index - The index of the sub-race (e.g., "high-elf")
 * @returns {Promise<object>} A promise that resolves to a single sub-race object.
 */
export function getSubRace(index) {
    return fetchFromApi(`/api/subraces/${index}`);
}

// --- Skills ---

/**
 * Fetches a list of all D&D skills.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of skill objects.
 */
export function getAllSkills() {
    return fetchFromApi("/api/skills/");
}

/**
 * Fetches the details for a single skill by its index.
 * @param {string} index - The index of the skill (e.g., "intimidation")
 * @returns {Promise<object>} A promise that resolves to a single skill object.
 */
export function getSkill(index) {
    return fetchFromApi(`/api/skills/${index}`);
}

// --- Backgrounds ---

/**
 * Fetches a list of all D&D backgrounds.
 * @returns {Promise<Array<object>>} A promise that resolves to an array of background objects.
 */
export function getAllBackgrounds() {
    return fetchFromApi("/api/backgrounds/");
}

/**
 * Fetches the details for a single background by its index.
 * @param {string} index - The index of the background (e.g., "acolyte")
 * @returns {Promise<object>} A promise that resolves to a single background object.
 */
export function getBackground(index) {
    return fetchFromApi(`/api/backgrounds/${index}`);
}