package main

import (
	"character-creator/dndapi"
	"encoding/json"
	"log"
	"net/http"
	"strings"
)

// Write a JSON response with a given status code
func encodeJsonResponse(writer http.ResponseWriter, data any, statusCode int) {
	writer.Header().Set("Content-Type", "application/json")
	writer.WriteHeader(statusCode)

	// Attempt to encode data as JSON
	if err := json.NewEncoder(writer).Encode(data); err != nil {
		// Log the error and send HTTP error response
		log.Printf("Error encoding JSON response: %v", err)
		http.Error(writer, "Error encoding response", http.StatusInternalServerError)
	}
}

// Send an HTTP error response
func sendHttpError(writer http.ResponseWriter, err error, statusCode int) {
	log.Printf("HTTP Error: %v", err)
	http.Error(writer, err.Error(), statusCode)
}

// --- GENERIC HANDLER FACTORY ---

// getAllFunc defines the signature for a function that gets all resources of a type.
// (e.g., dndapi.GetRaces)
type getAllFunc[T any] func() ([]T, error)

// getOneFunc defines the signature for a function that gets a single resource by index.
// (e.g., dndapi.GetRace)
type getOneFunc[T any] func(index string) (T, error)

/**
 * Factory function returning a generic http.HandlerFunc.
 * It is parameterized by the resource type 'T' (e.g., models.RaceResult).
 *
 * It takes the URL prefix to trim, a function to get all items,
 * and a function to get one item.
 */
func createResourceHandler[T any](
	prefix string,
	getAll getAllFunc[T],
	getOne getOneFunc[T],
) http.HandlerFunc {

	return func(writer http.ResponseWriter, request *http.Request) {
		// Extract the index (e.g., "dwarf") from the URL path
		// We also trim a trailing slash in case of /api/races/dwarf/
		index := strings.TrimSuffix(strings.TrimPrefix(request.URL.Path, prefix), "/")

		if index == "" {
			// No index provided, so get all items
			items, err := getAll()
			if err != nil {
				sendHttpError(writer, err, http.StatusInternalServerError)
				return
			}
			encodeJsonResponse(writer, items, http.StatusOK)
		} else {
			// Index provided, get a single item
			item, err := getOne(index)
			if err != nil {
				sendHttpError(writer, err, http.StatusInternalServerError)
				return
			}
			encodeJsonResponse(writer, item, http.StatusOK)
		}
	}
}

func main() {
	// Create a new ServeMux, which is an HTTP request router
	mux := http.NewServeMux()

	// Register our handlers using the generic factory.
	// The type parameter (e.g., [models.RaceResult]) is inferred by the
	// compiler from the functions we pass in.
	mux.HandleFunc("/api/races/", createResourceHandler(
		"/api/races/",
		dndapi.GetRaces,
		dndapi.GetRace,
	))

	mux.HandleFunc("/api/subraces/", createResourceHandler(
		"/api/subraces/",
		dndapi.GetSubRaces,
		dndapi.GetSubRace,
	))

	mux.HandleFunc("/api/classes/", createResourceHandler(
		"/api/classes/",
		dndapi.GetClasses,
		dndapi.GetClass,
	))

	mux.HandleFunc("/api/skills/", createResourceHandler(
		"/api/skills/",
		dndapi.GetSkills,
		dndapi.GetSkill,
	))

	mux.HandleFunc("/api/backgrounds/", createResourceHandler(
		"/api/backgrounds/",
		dndapi.GetBackgrounds,
		dndapi.GetBackground,
	))

	// Serve static front-end files (HTML, CSS, JS)
	// from a directory named 'public'.
	fileServer := http.FileServer(http.Dir("./public"))
	mux.Handle("/", fileServer) // Serve static files for any path not matched above

	const port = ":8080"
	log.Printf("Server starting on http://localhost%s", port)

	// Start the server
	if err := http.ListenAndServe(port, mux); err != nil {
		log.Fatalf("Could not start server: %s\n", err)
	}
}
