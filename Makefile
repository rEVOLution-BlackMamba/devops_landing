.DEFAULT_GOAL := help
IMAGE         := devops-landing
CONTAINER     := devops-landing
PORT          := 8080

.PHONY: help up build smoke lint test clean

help: ## Show available targets
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) \
	  | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-10s\033[0m %s\n", $$1, $$2}'

up: ## Start local dev server (http://localhost:8080, live-reload via volumes)
	docker compose up

build: ## Build the Docker image locally
	docker build -t $(IMAGE):local .

smoke: build ## Build, smoke-test HTTP 200, then clean up
	docker run -d --name $(CONTAINER)-smoke -p $(PORT):80 $(IMAGE):local
	@sleep 2
	@STATUS=$$(curl -s -o /dev/null -w "%{http_code}" http://localhost:$(PORT)/); \
	  docker stop $(CONTAINER)-smoke && docker rm $(CONTAINER)-smoke; \
	  echo "HTTP $$STATUS"; \
	  [ "$$STATUS" = "200" ] || exit 1
	@echo "Smoke test passed."

lint: ## Validate HTML, JS, and nginx.conf syntax
	python3 -c "from html.parser import HTMLParser; V=type('V',(HTMLParser,),{}); V().feed(open('index.html').read()); print('HTML OK')"
	node --check main.js && echo "JS OK"
	docker run --rm -v "$$(pwd)/nginx.conf:/etc/nginx/conf.d/test.conf:ro" nginx:1.27-alpine nginx -t

test: ## Run main.js unit tests (zero-dependency, node:test + a hand-rolled DOM shim)
	node --test test/*.test.js

clean: ## Remove local container and image
	-docker rm -f $(CONTAINER) $(CONTAINER)-smoke 2>/dev/null
	-docker rmi $(IMAGE):local 2>/dev/null
	@echo "Clean complete."
