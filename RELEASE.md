# 🚀 GrowFlow Release Setup

## GitHub Actions Multi-Arch Docker Build

### 📋 GitHub Secrets Setup

In deinem GitHub Repository unter `Settings > Secrets and variables > Actions` diese Secrets hinzufügen:

```
DOCKER_USERNAME = dein-docker-hub-username
DOCKER_PASSWORD = dein-docker-hub-token
```

💡 **Tip:** Verwende einen Docker Hub Access Token anstatt dein Passwort (sicherer).

### 🏷️ Release Workflow

```bash
# 1. Code fertig committen
git add .
git commit -m "Release v0.1.0"
git push origin main

# 2. Tag erstellen und pushen
git tag v0.1.0
git push origin v0.1.0
```

→ GitHub Actions baut automatisch Multi-Arch Images: `moritz03/growflow:0.1.0` + `moritz03/growflow:latest`

### 🏗️ Automatische Builds

- **Main Branch Push**: `moritz03/growflow:main`
- **Tag Push**: `moritz03/growflow:v0.1.0` + `moritz03/growflow:latest`
- **Architectures**: `linux/amd64`, `linux/arm64`

### 📦 Home Assistant Add-on Update

Nach erfolgreichem Build in deinem Add-on Repository:

1. **config.yaml updaten**:
```yaml
arch:
  - amd64
  - aarch64  # arm64
```

2. **Version synchronisieren**:
```yaml
version: "0.1.0"
```

### 🔄 Development Workflow

```bash
# Development builds (main branch)
git push origin main
→ moritz03/growflow:main

# Release builds (tags)
git tag v0.1.1 && git push origin v0.1.1
→ moritz03/growflow:0.1.1 + moritz03/growflow:latest
```

## ✅ Ready to Release!

Die Pipeline ist eingerichtet. Beim nächsten Tag-Push werden automatisch Multi-Arch Images gebaut! 🎉