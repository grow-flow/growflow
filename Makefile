.PHONY: help build push clean

VERSION ?= dev

help:
	@echo "GrowFlow Docker Commands"
	@echo ""
	@echo "  make build          Build and load local image"
	@echo "  make push           Build multi-arch and push to registry"
	@echo "  make clean          Remove local images"
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
