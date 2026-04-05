# =============================================================================
# 5e Character Creator — Makefile
# =============================================================================
# Targets ending in -llm produce terse, token-efficient output suitable for
# piping into an LLM context window (no colour codes, minimal prose).
#
# Usage:
#   make build          # compile binary
#   make run            # run the server
#   make check          # run all quality gates
#   make check-llm      # same, LLM-friendly output
# =============================================================================

BINARY   := character-creator
GO       := go
PORT     := 8080

# Detect OS for binary extension and cross-platform shell commands
ifeq ($(OS),Windows_NT)
  BINARY_EXT := .exe
  EXEC_CMD   := $(BINARY).exe
  RM_CMD     := if exist $(BINARY).exe del /Q /F $(BINARY).exe
  HELP_CMD   := powershell -NoProfile -Command "Select-String -Path '$(firstword $(MAKEFILE_LIST))' -Pattern '^[a-zA-Z_-]+:.*?## .*$$' | ForEach-Object {$$parts = $$_.Line -split ':.*?## ' ; Write-Host ('  {0,-22} {1}' -f$$parts[0], $$parts[1]) }"
  FMT_CMD    := powershell -NoProfile -Command "$$diff = gofmt -l . ; if ($$diff) { Write-Host 'Formatting issues in:' ; Write-Host$$diff ; exit 1 } else { Write-Host 'All Go files are properly formatted.' }"
  INIT_CMD   := powershell -NoProfile -Command "if (-not (Test-Path go.mod)) { $(GO) mod init character-creator; $(GO) mod tidy; Write-Host 'go.mod created.' } else { Write-Host 'go.mod already exists.' }"
  OPEN_CMD   := cmd /c start http://localhost:$(PORT)
else
  BINARY_EXT :=
  EXEC_CMD   := ./$(BINARY)
  RM_CMD     := rm -f $(BINARY)
  HELP_CMD   := grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-22s\033[0m %s\n", $$1,$$2}' | sort
  FMT_CMD    := DIFF=$$(gofmt -l .); if [ -n "$$DIFF" ]; then echo "Formatting issues in:"; echo "$$DIFF"; exit 1; else echo "All Go files are properly formatted."; fi
  INIT_CMD   := if [ ! -f go.mod ]; then $(GO) mod init character-creator && $(GO) mod tidy && echo "go.mod created."; else echo "go.mod already exists."; fi
  OPEN_CMD   := open http://localhost:$(PORT) 2>/dev/null || xdg-open http://localhost:$(PORT) 2>/dev/null || echo "Visit: http://localhost:$(PORT)"
endif

OUTPUT := $(BINARY)$(BINARY_EXT)

# =============================================================================
# BUILD
# =============================================================================

.PHONY: build
build:  ## Compile the Go binary
	$(GO) build -o $(OUTPUT) .
	@echo "Built: $(OUTPUT)"

.PHONY: build-llm
build-llm:  ## Compile (LLM output)
	$(GO) build -o $(OUTPUT) . 2>&1

.PHONY: clean
clean:  ## Remove compiled binary
	@$(RM_CMD)
	@echo "Cleaned."

# =============================================================================
# RUN
# =============================================================================

.PHONY: run
run: build  ## Build and start the server on :8080
	@echo "Starting server at http://localhost:$(PORT)"
	$(EXEC_CMD)

.PHONY: run-dev
run-dev:  ## Run directly with go run (no compile step, faster iteration)
	$(GO) run main.go

# =============================================================================
# QUALITY GATES
# =============================================================================

.PHONY: vet
vet:  ## Run go vet
	@echo "--- go vet ---"
	$(GO) vet ./...

.PHONY: vet-llm
vet-llm:  ## go vet (LLM output)
	$(GO) vet ./... 2>&1

.PHONY: fmt
fmt:  ## Check formatting with gofmt (does not modify files)
	@echo "--- gofmt check ---"
	@$(FMT_CMD)

.PHONY: fmt-llm
fmt-llm:  ## gofmt check (LLM output)
	@gofmt -l . 2>&1

.PHONY: fmt-fix
fmt-fix:  ## Auto-fix formatting with gofmt
	gofmt -w .
	@echo "Formatted all Go files."

.PHONY: test-go
test-go:  ## Run only Go backend tests
	@echo "--- running go tests ---"
	$(GO) test -v ./...

.PHONY: test-js
test-js:  ## Run only JS frontend tests (Vitest)
	@echo "--- running js tests ---"
	npm test

.PHONY: test
test: test-go test-js ## Run all tests (Go + JS)

.PHONY: test-go-llm
test-llm:  ## Run tests (LLM output — no colour, concise)
	$(GO) test ./...

.PHONY: test-llm
test: test-go-llm test-js ## Run all tests (Go + JS)

.PHONY: check
check: vet fmt test  ## Run all quality gates (vet + fmt check + Go & JS tests)
	@echo ""
	@echo "All checks passed."

.PHONY: check-llm
check-llm: vet-llm fmt-llm test-llm  ## All quality gates, LLM-friendly output

# =============================================================================
# DOCKER — DEVELOPMENT
# =============================================================================

DEV_IMAGE     := char-dev-image
DEV_CONTAINER := char-dev-container

.PHONY: docker-dev-build
docker-dev-build:  ## Build the dev Docker image
	docker build -t $(DEV_IMAGE) -f Dockerfile.dev .

.PHONY: docker-dev-start
docker-dev-start:  ## Start the dev container with volume mount
	docker run -d \
	  --name $(DEV_CONTAINER) \
	  -p $(PORT):$(PORT) \
	  --mount type=bind,source="$(CURDIR)",target=/app \
	  $(DEV_IMAGE)
	@echo "Dev container started. Connect with: make docker-dev-shell"

.PHONY: docker-dev-shell
docker-dev-shell:  ## Attach a shell to the running dev container
	docker exec -it $(DEV_CONTAINER) bash

.PHONY: docker-dev-stop
docker-dev-stop:  ## Stop and remove the dev container
	docker stop $(DEV_CONTAINER) && docker rm $(DEV_CONTAINER)

.PHONY: docker-dev-logs
docker-dev-logs:  ## Tail logs from the dev container
	docker logs -f $(DEV_CONTAINER)

# =============================================================================
# DOCKER — PRODUCTION
# =============================================================================

PROD_IMAGE := char-creator-prod

.PHONY: docker-prod-build
docker-prod-build:  ## Build the production Docker image
	docker build -t $(PROD_IMAGE) -f Dockerfile.deploy .

.PHONY: docker-prod-run
docker-prod-run:  ## Run the production image
	docker run --rm -p $(PORT):$(PORT) $(PROD_IMAGE)

# =============================================================================
# CONVENIENCE
# =============================================================================

.PHONY: install
install: ## Install both Go and JS dependencies
	$(GO) mod download
	npm install

.PHONY: tidy
tidy:  ## Run go mod tidy to sync dependencies
	$(GO) mod tidy

.PHONY: deps
deps:  ## Download all Go dependencies
	$(GO) mod download

.PHONY: init
init:  ## Initialize go.mod if it doesn't exist (needed on fresh clone)
	@$(INIT_CMD)

.PHONY: open
open:  ## Open the app in the default browser
	@$(OPEN_CMD)

# =============================================================================
# HELP
# =============================================================================

.PHONY: help
help:  ## Show this help
	@$(HELP_CMD)

.DEFAULT_GOAL := help