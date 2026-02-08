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

group "addon" {
  targets = ["addon-amd64", "addon-aarch64"]
}

# --- Base app image (multi-arch manifest) ---

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

# --- HA addon images (per-arch, required by HA Supervisor) ---

target "_addon-base" {
  dockerfile = "growflow-addon/growflow/Dockerfile"
  args = {
    BUILD_FROM = "${REGISTRY}/${IMAGE_NAME}:${VERSION}"
  }
  labels = {
    "io.hass.type"    = "addon"
    "io.hass.version" = "${VERSION}"
  }
}

target "addon-amd64" {
  inherits  = ["_addon-base"]
  platforms = ["linux/amd64"]
  tags      = ["${REGISTRY}/${IMAGE_NAME}-amd64:${VERSION}"]
}

target "addon-aarch64" {
  inherits  = ["_addon-base"]
  platforms = ["linux/arm64"]
  tags      = ["${REGISTRY}/${IMAGE_NAME}-aarch64:${VERSION}"]
}
