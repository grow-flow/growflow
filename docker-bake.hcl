variable "REGISTRY" {
  default = "ghcr.io/grow-flow"
}

variable "IMAGE_NAME" {
  default = "growflow"
}

variable "VERSION" {
  default = "dev"
}

group "default" {
  targets = ["growflow"]
}

target "growflow" {
  dockerfile = "Dockerfile"
  platforms = ["linux/amd64", "linux/arm64"]
  tags = [
    "${REGISTRY}/${IMAGE_NAME}:${VERSION}",
    equal(VERSION, "latest") ? "${REGISTRY}/${IMAGE_NAME}:latest" : "",
  ]
  labels = {
    "org.opencontainers.image.source" = "https://github.com/grow-flow/growflow"
    "org.opencontainers.image.version" = "${VERSION}"
  }
  cache-from = ["type=registry,ref=${REGISTRY}/${IMAGE_NAME}:buildcache"]
  cache-to = ["type=registry,ref=${REGISTRY}/${IMAGE_NAME}:buildcache,mode=max"]
}

target "growflow-local" {
  inherits = ["growflow"]
  platforms = ["linux/amd64"]
  tags = ["${IMAGE_NAME}:dev"]
  output = ["type=docker"]
  cache-from = ["type=registry,ref=${REGISTRY}/${IMAGE_NAME}:buildcache"]
  cache-to = []
}
