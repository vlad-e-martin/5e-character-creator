package dndapi

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"

	"character-creator/models"
)

/**
 * Fetches data from a URL and unmarshals the JSON response
 * into whatever type 'T' is provided.
 */
func fetchAndUnmarshal[T any](url string) (T, error) {
	// Zero value of type T (e.g., nil for slices, empty struct for structs).
	// Returns a typed, empty value in case of an error.
	var zeroVal T

	response, err := http.Get(url)
	if err != nil {
		return zeroVal, fmt.Errorf("failed while fetching from %s: %v", url, err)
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return zeroVal, fmt.Errorf("failed to make request to the API from %s: %s", url, response.Status)
	}

	body, err := io.ReadAll(response.Body)
	if err != nil {
		return zeroVal, fmt.Errorf("failed to read the contents of the API response from %s: %v", url, err)
	}

	var result T

	// Unmarshal the body into the address of 'result'.
	if err := json.Unmarshal(body, &result); err != nil {
		return zeroVal, fmt.Errorf("failed to parse the API response as JSON from %s: %v", url, err)
	}

	// We return the populated result.
	return result, nil
}

func getAllSummaries(url string) ([]models.ApiResult, error) {
	// Call the generic function, specifying the proper type
	resultList, err := fetchAndUnmarshal[models.ApiResultList](url)
	if err != nil {
		return nil, err
	}

	// Now, perform the logic that is *specific* to this function
	fmt.Printf("Received %d results in the API response from %s\n", resultList.Count, url)

	return resultList.Results, nil
}

const apiBaseURL = "https://www.dnd5eapi.co/api/2014/"

func getAllDetails[T any](resource string) ([]T, error) {
	var detailsList []T

	// Fetch list of all available races
	apiUrl, err := url.JoinPath(apiBaseURL, resource)
	if err != nil {
		return detailsList, fmt.Errorf("failed to put together API URL for all %s: %v", resource, err)
	}

	entries, err := getAllSummaries(apiUrl)
	if err != nil {
		return detailsList, err
	}

	// For each entry, fetch entry details
	for _, entry := range entries {
		result, err := getDetails[T](resource, entry.Index)
		if err != nil {
			return detailsList, err
		}

		// Build list of details for each entry
		detailsList = append(detailsList, result)
	}

	// Return list of all details
	return detailsList, nil
}

func getDetails[T any](resource string, index string) (T, error) {
	var detailNil T

	// Build API URL for the specified index
	detailUrl, err := url.JoinPath(apiBaseURL, resource, index)
	if err != nil {
		return detailNil, fmt.Errorf("failed to put together API URL for %s index '%s': %v", resource, index, err)
	}

	// Fetch details for the specified index
	result, err := fetchAndUnmarshal[T](detailUrl)
	if err != nil {
		return detailNil, err
	}

	return result, nil
}

// --- RACES ---

func normalizeRaceBonuses(race *models.RaceResult) {
	// If it already has options (like from our local JSON), do nothing
	if len(race.AbilityBonusOptions) > 0 {
		race.RawAbilityBonuses = nil
		return
	}

	// If it has raw bonuses from the API, convert them to a single fixed option
	if len(race.RawAbilityBonuses) > 0 {
		var unifiedBonuses []models.AbilityBonus
		for _, rb := range race.RawAbilityBonuses {
			if rb.AbilityScore != nil {
				unifiedBonuses = append(unifiedBonuses, models.AbilityBonus{
					Bonus:         rb.Bonus,
					AbilityScores: []models.ApiResult{*rb.AbilityScore}, // Convert single stat to array
				})
			}
		}

		race.AbilityBonusOptions = []models.BonusOption{
			{
				Desc:    "Standard Racial Bonuses",
				Bonuses: unifiedBonuses,
			},
		}
		race.RawAbilityBonuses = nil // Clear raw data so it doesn't clutter the JSON response
	}
}

func GetRaces() ([]models.RaceResult, error) {
	// 1. Fetch official races from the API
	apiRaces, err := getAllDetails[models.RaceResult]("races")
	if err != nil {
		return nil, fmt.Errorf("failed to fetch API races: %v", err)
	}

	// 2. Fetch our custom local races
	customRaces := GetLocalRaces()

	// Create a map of custom races for fast lookup
	customMap := make(map[string]models.RaceResult)
	for _, cr := range customRaces {
		customMap[cr.Index] = cr
	}

	var combinedRaces []models.RaceResult

	// Add API races, UNLESS overridden by our local JSON
	for _, ar := range apiRaces {
		if customOverride, exists := customMap[ar.Index]; exists {
			combinedRaces = append(combinedRaces, customOverride)
			delete(customMap, ar.Index) // Remove so we don't add it twice
		} else {
			normalizeRaceBonuses(&ar)
			combinedRaces = append(combinedRaces, ar)
		}
	}

	// Add any remaining purely custom races (Aarakocra, Changeling, etc.)
	for _, cr := range customRaces {
		if _, alreadyAdded := customMap[cr.Index]; alreadyAdded {
			combinedRaces = append(combinedRaces, cr)
		}
	}

	return combinedRaces, nil
}

func GetRace(raceIndex string) (models.RaceResult, error) {
	// 1. Try to fetch from the official API first
	apiRace, err := getDetails[models.RaceResult]("races", raceIndex)

	// If no error, we're done, return answer.
	if err == nil {
		return apiRace, nil
	}

	// 2. If the API failed, check the local data
	localRace, localErr := GetLocalRace(raceIndex)

	// If no error, we're done, return answer.
	if localErr == nil {
		return localRace, nil
	}

	// 3. If both failed, return a final error
	return models.RaceResult{}, fmt.Errorf("race '%s' not found in API or local data", raceIndex)
}

// --- SUB RACES ---

func GetSubRaces() ([]models.SubRaceResult, error) {
	var subRacesNil []models.SubRaceResult

	subRaces, err := getAllDetails[models.SubRaceResult]("subraces")
	if err != nil {
		return subRacesNil, err
	}

	return subRaces, nil
}

func GetSubRace(subRaceIndex string) (models.SubRaceResult, error) {
	var subRaceNil models.SubRaceResult

	subRace, err := getDetails[models.SubRaceResult]("subraces", subRaceIndex)
	if err != nil {
		return subRaceNil, err
	}

	return subRace, nil
}

// --- CLASSES ---

func GetClasses() ([]models.ClassResult, error) {
	var classesNil []models.ClassResult

	classes, err := getAllDetails[models.ClassResult]("classes")
	if err != nil {
		return classesNil, err
	}

	return classes, nil
}

func GetClass(classIndex string) (models.ClassResult, error) {
	var classNil models.ClassResult

	dndClass, err := getDetails[models.ClassResult]("classes", classIndex)
	if err != nil {
		return classNil, err
	}

	return dndClass, nil
}

// --- SKILLS ---

func GetSkills() ([]models.SkillResult, error) {
	var skillsNil []models.SkillResult

	skills, err := getAllDetails[models.SkillResult]("skills")
	if err != nil {
		return skillsNil, err
	}

	return skills, nil
}

func GetSkill(skillIndex string) (models.SkillResult, error) {
	var skillNil models.SkillResult

	skill, err := getDetails[models.SkillResult]("skills", skillIndex)
	if err != nil {
		return skillNil, err
	}

	return skill, nil
}
