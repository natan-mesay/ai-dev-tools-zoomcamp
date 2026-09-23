.PHONY: e2e e2e-headed test-integration test up down logs

# Run Playwright End-to-End tests against running docker-compose
e2e:
	@echo "Running Playwright E2E tests..."
	npm test --prefix e2e

# Run Playwright E2E tests in headed mode (interactive browser)
e2e-headed:
	@echo "Running Playwright E2E tests in headed mode..."
	npm run test:headed --prefix e2e

# Run backend PostgreSQL integration tests
test-integration:
	@echo "Running backend integration tests..."
	uv run --project week_3/backend pytest week_3/backend/tests/test_compose_integration.py -v

# Run all test suites (unit, integration, and E2E)
test: test-integration e2e

# Start Docker Compose services
up:
	@echo "Starting Docker Compose services..."
	docker compose -f week_3/docker-compose.yaml up -d

# Stop Docker Compose services
down:
	@echo "Stopping Docker Compose services..."
	docker compose -f week_3/docker-compose.yaml down

# Tail service logs
logs:
	docker compose -f week_3/docker-compose.yaml logs -f
