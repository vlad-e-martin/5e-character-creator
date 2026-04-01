package main

import (
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
)

// Test that encodeJsonResponse writes the correct status code and JSON body.
func TestEncodeJsonResponse(t *testing.T) {
	type payload struct {
		Name string `json:"name"`
	}

	w := httptest.NewRecorder()
	encodeJsonResponse(w, payload{Name: "Gandalf"}, http.StatusOK)

	if w.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", w.Code)
	}
	if ct := w.Header().Get("Content-Type"); ct != "application/json" {
		t.Fatalf("expected Content-Type application/json, got %q", ct)
	}

	var got payload
	if err := json.Unmarshal(w.Body.Bytes(), &got); err != nil {
		t.Fatalf("response body is not valid JSON: %v", err)
	}
	if got.Name != "Gandalf" {
		t.Fatalf("expected name %q, got %q", "Gandalf", got.Name)
	}
}

// Test that createResourceHandler routes correctly:
//   - no trailing segment  → calls getAll
//   - trailing index       → calls getOne with that index
func TestCreateResourceHandler_Routing(t *testing.T) {
	getAllCalled := false
	getOneCalled := false
	capturedIndex := ""

	getAll := func() ([]string, error) {
		getAllCalled = true
		return []string{"dwarf", "elf"}, nil
	}
	getOne := func(index string) (string, error) {
		getOneCalled = true
		capturedIndex = index
		return "dwarf", nil
	}

	handler := createResourceHandler("/api/races/", getAll, getOne)

	t.Run("list endpoint calls getAll", func(t *testing.T) {
		getAllCalled = false
		req := httptest.NewRequest(http.MethodGet, "/api/races/", nil)
		w := httptest.NewRecorder()
		handler(w, req)

		if !getAllCalled {
			t.Error("expected getAll to be called")
		}
		if w.Code != http.StatusOK {
			t.Errorf("expected 200, got %d", w.Code)
		}
	})

	t.Run("detail endpoint calls getOne with correct index", func(t *testing.T) {
		getOneCalled = false
		req := httptest.NewRequest(http.MethodGet, "/api/races/dwarf", nil)
		w := httptest.NewRecorder()
		handler(w, req)

		if !getOneCalled {
			t.Error("expected getOne to be called")
		}
		if capturedIndex != "dwarf" {
			t.Errorf("expected index %q, got %q", "dwarf", capturedIndex)
		}
		if w.Code != http.StatusOK {
			t.Errorf("expected 200, got %d", w.Code)
		}
	})
}

// Test that createResourceHandler returns 500 when getAll/getOne return an error.
func TestCreateResourceHandler_ErrorPropagation(t *testing.T) {
	boom := errors.New("upstream failure")

	getAll := func() ([]string, error) { return nil, boom }
	getOne := func(_ string) (string, error) { return "", boom }

	handler := createResourceHandler("/api/races/", getAll, getOne)

	t.Run("getAll error yields 500", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/races/", nil)
		w := httptest.NewRecorder()
		handler(w, req)
		if w.Code != http.StatusInternalServerError {
			t.Errorf("expected 500, got %d", w.Code)
		}
	})

	t.Run("getOne error yields 500", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/races/dwarf", nil)
		w := httptest.NewRecorder()
		handler(w, req)
		if w.Code != http.StatusInternalServerError {
			t.Errorf("expected 500, got %d", w.Code)
		}
	})
}
