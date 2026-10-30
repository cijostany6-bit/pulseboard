.PHONY: build up down test clean kind-up kind-down learn smoke-test

COMPOSE := docker-compose
SERVICES := api-gateway auth-service health-checker metrics-collector alert-manager

build:
	@echo "Building all Docker images..."
	./scripts/build-all.sh

up:
	@echo "Starting PulseBoard locally..."
	$(COMPOSE) up -d --build
	@echo "Waiting for services to be healthy..."
	@sleep 10
	@$(COMPOSE) ps

down:
	@echo "Stopping PulseBoard..."
	$(COMPOSE) down -v

test:
	@echo "Running tests..."
	@for svc in $(SERVICES); do \
		echo "Testing $$svc..."; \
		(cd services/$$svc && npm test) || exit 1; \
	done

smoke-test:
	./scripts/smoke-test.sh

clean:
	@echo "Cleaning up..."
	$(COMPOSE) down -v --rmi all --remove-orphans
	docker system prune -f

kind-up:
	@echo "Creating kind cluster..."
	kind create cluster --name pulseboard
	kubectl apply -f k8s/namespace.yaml
	kubectl apply -f k8s/

kind-down:
	@echo "Deleting kind cluster..."
	kind delete cluster --name pulseboard

learn:
	@echo "=== PulseBoard Learning Mode ==="
	@echo "1. Start local: make up"
	@echo "2. Check health: curl http://localhost:8080/health"
	@echo "3. View logs: docker-compose logs -f"
	@echo "4. Deploy to k8s: make kind-up"
	@echo "5. Teardown: make down"
