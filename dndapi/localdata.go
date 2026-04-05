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

// These hold our in-memory data
var localBackgrounds []models.BackgroundResult

// var localRaces []models.RaceResult // Ready for when you need it!

// init() runs automatically exactly once when the application starts
func init() {
	loadBackgrounds()
}

func loadBackgrounds() {
	// Read the embedded file
	fileBytes, err := staticFiles.ReadFile("data/backgrounds.json")
	if err != nil {
		log.Fatalf("Failed to read embedded backgrounds.json: %v", err)
	}

	// Unmarshal the JSON directly into our models
	if err := json.Unmarshal(fileBytes, &localBackgrounds); err != nil {
		log.Fatalf("Failed to parse backgrounds.json: %v", err)
	}

	log.Printf("Successfully loaded %d local backgrounds.", len(localBackgrounds))
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
