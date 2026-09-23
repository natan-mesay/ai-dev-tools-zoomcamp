.PHONY: e2e e2e-headed test-integration test up down logs

# Run Playwright End-to-End tests against running docker-compose
e2e:
	@echo "Running Playwright E2E tests..."
	npm test --prefix ../e2e

# Run Playwright E2E tests in headed mode
e2e-headed:
	@echo "Running Playwright E2E tests in headed mode..."
	npm run test:headed --prefix ../e2e

# Run backend PostgreSQL integration tests
test-integration:
	@echo "Running backend integration tests..."
	uv run --project backend pytest backend/tests/test_compose_integration.py -v

# Run all test suites
test: test-integration e2e

# Start Docker Compose services
up:
	docker compose up -d

# Stop Docker Compose services
down:
	docker compose down

# Tail service logs
logs:
	docker compose logs -f
