package dndapi

import (
	"embed"
	"encoding/json"
	"fmt"
	"log"

	"character-creator/models"
)

//go:embed data/*.json
var staticFiles embed.FS

// These hold local extensions of the API data
var localBackgrounds []models.BackgroundResult
var localRaces []models.RaceResult

// init() runs only once when the application starts
func init() {
	localBackgrounds = loadJSONData[models.BackgroundResult]("data/backgrounds.json")
	localRaces = loadJSONData[models.RaceResult]("data/races.json")
}

// loadJSONData is a generic function that reads a local JSON file
// and unmarshals it into a slice of the specified type T.
func loadJSONData[T any](filename string) []T {
	fileBytes, err := staticFiles.ReadFile(filename)
	if err != nil {
		log.Fatalf("Failed to read embedded %s: %v", filename, err)
	}

	var data []T
	if err := json.Unmarshal(fileBytes, &data); err != nil {
		log.Fatalf("Failed to parse %s: %v", filename, err)
	}

	log.Printf("Successfully loaded %d items from %s.", len(data), filename)

	return data
}

// --- Local Race Data Accessors ---
func GetLocalRaces() []models.RaceResult {
	return localRaces
}

func GetLocalRace(index string) (models.RaceResult, error) {
	for _, r := range localRaces {
		if r.Index == index {
			return r, nil
		}
	}
	return models.RaceResult{}, fmt.Errorf("local race with index '%s' not found", index)
}

// --- Background Data Accessors ---

func GetBackgrounds() ([]models.BackgroundResult, error) {
	return localBackgrounds, nil
}

func GetBackground(index string) (models.BackgroundResult, error) {
	for _, bg := range localBackgrounds {
		if bg.Index == index {
			return bg, nil
		}
	}
	return models.BackgroundResult{}, fmt.Errorf("background with index '%s' not found", index)
}
