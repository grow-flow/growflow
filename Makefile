.PHONY: help build push clean release-patch release-minor release-major

VERSION ?= dev

help:
	@echo "GrowFlow Docker Commands"
	@echo ""
	@echo "  make build          Build and load local image"
	@echo "  make push           Build multi-arch and push to registry"
	@echo "  make clean          Remove local images"
	@echo ""
	@echo "Release:"
	@echo "  make release-patch          Bump patch (0.4.2 → 0.4.3)"
	@echo "  make release-minor          Bump minor (0.4.2 → 0.5.0)"
	@echo "  make release-major          Bump major (0.4.2 → 1.0.0)"
	@echo ""
	@echo "Examples:"
	@echo "  make build                  Build local dev image"
	@echo "  make push VERSION=v0.3.0    Build and push multi-arch"

build:
	docker buildx bake -f docker-bake.hcl growflow-local --load

push:
	docker buildx bake -f docker-bake.hcl --push

clean:
	docker rmi growflow:dev 2>/dev/null || true

release-patch:
	npm version patch && git push && git push --tags

release-minor:
	npm version minor && git push && git push --tags

release-major:
	npm version major && git push && git push --tags
