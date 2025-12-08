# Automated Release Setup - Quick Start

## ✅ What's Been Implemented

### Main Repo (growflow)
- ✅ Updated [.github/workflows/docker.yml](.github/workflows/docker.yml) → Now triggers on git tags only
- ✅ Added automatic addon repo triggering via repository_dispatch
- ✅ Updated [CLAUDE.md](CLAUDE.md) with new release process documentation

### Addon Repo (growflow-addon/)
- ✅ Created `.github/workflows/auto-update.yml` - Auto-update workflow
- ✅ Created `.github/scripts/update-version.js` - Version update script
- ✅ Migrated `config.yaml` from Docker Hub → ghcr.io
- ✅ Migrated `Dockerfile` from Docker Hub → ghcr.io
- ✅ Updated `CHANGELOG.md` with registry migration notes
- ✅ Created [SETUP.md](growflow-addon/SETUP.md) with detailed instructions

## 🚀 Next Steps (Required)

### 1. Create Personal Access Token (PAT)

1. Go to GitHub Settings → Developer settings → [Personal access tokens](https://github.com/settings/tokens)
2. Click "Generate new token (classic)"
3. Settings:
   - **Name**: `ADDON_REPO_TOKEN`
   - **Scopes**: Select `repo` (Full control)
   - **Expiration**: No expiration (or 1 year minimum)
4. Click "Generate token"
5. **Copy the token** (you won't see it again!)

### 2. Add Token to Main Repo Secrets

1. Go to https://github.com/grow-flow/growflow/settings/secrets/actions
2. Click "New repository secret"
3. **Name**: `ADDON_REPO_TOKEN`
4. **Value**: Paste your PAT
5. Click "Add secret"

### 3. Commit and Push Changes

```bash
# Main repo changes
git add .github/workflows/docker.yml CLAUDE.md
git commit -m "Add automated release workflow with addon sync"
git push

# Addon repo changes (navigate to addon repo first)
cd growflow-addon
git add .
git commit -m "Add automation workflows and migrate to ghcr.io"
git push
```

### 4. Test the Automation

```bash
# Option A: Dry run (test script locally)
cd growflow-addon
node .github/scripts/update-version.js v0.2.1 --dry-run

# Option B: Full integration test
cd ../  # Back to main repo
git tag v0.2.1-test
git push origin v0.2.1-test

# Monitor workflows:
# - Main repo: https://github.com/grow-flow/growflow/actions
# - Addon repo: https://github.com/grow-flow/growflow-addon/actions

# Clean up test tag
git tag -d v0.2.1-test
git push origin :refs/tags/v0.2.1-test
cd growflow-addon
git tag -d v0.2.1-test
git push origin :refs/tags/v0.2.1-test
```

### 5. First Production Release

```bash
# When ready for real release
cd growflow  # Main repo
git tag v0.3.0
git push --tags

# That's it! Everything else is automatic:
# - Docker image builds and pushes to ghcr.io
# - Addon repo updates all version files
# - Addon repo creates matching git tag
```

## 📋 How It Works

```
You: git tag v0.3.0 && git push --tags
  ↓
Main Repo Workflow (.github/workflows/docker.yml):
  1. Build multi-arch Docker images (amd64, arm64, arm/v7)
  2. Push to ghcr.io/grow-flow/growflow:v0.3.0 + :latest
  3. Trigger addon repo with version payload
  ↓
Addon Repo Workflow (.github/workflows/auto-update.yml):
  1. Receive version v0.3.0
  2. Run update-version.js script
  3. Update config.yaml, Dockerfile, CHANGELOG.md
  4. Commit changes
  5. Create git tag v0.3.0
  6. Push to GitHub
  ↓
Done! Both repos are now at v0.3.0
```

## 🔍 Verification

After a release, verify:

1. **Main repo**: https://github.com/grow-flow/growflow/tags
   - New tag should exist: `v0.3.0`

2. **Docker image**: https://github.com/orgs/grow-flow/packages/container/package/growflow
   - Should show `v0.3.0` and `latest` tags

3. **Addon repo**: https://github.com/grow-flow/growflow-addon/tags
   - New tag should exist: `v0.3.0`
   - Check [config.yaml](https://github.com/grow-flow/growflow-addon/blob/main/growflow/config.yaml) - version should be `v0.3.0`
   - Check [CHANGELOG.md](https://github.com/grow-flow/growflow-addon/blob/main/growflow/CHANGELOG.md) - new entry should exist

4. **Workflow runs**:
   - Main: https://github.com/grow-flow/growflow/actions
   - Addon: https://github.com/grow-flow/growflow-addon/actions

## 📚 Documentation

- Main repo: See [CLAUDE.md](CLAUDE.md) - CI/CD Pipeline section
- Addon repo: See [SETUP.md](growflow-addon/SETUP.md) - Detailed setup guide

## 🆘 Troubleshooting

**Workflow doesn't trigger**:
- Check `ADDON_REPO_TOKEN` secret exists in main repo
- Verify PAT has `repo` scope

**Permission denied**:
- PAT needs full `repo` access
- Regenerate token with correct permissions

**Version format error**:
- Use `vX.Y.Z` format (with 'v' prefix)
- Examples: `v0.3.0`, `v1.0.0`, `v0.2.1-beta`

**Manual fallback**:
- Go to addon repo Actions tab
- Run "Auto-Update Version" workflow manually
- Enter version when prompted

## 🎯 Current Version

Both repos are currently at: **v0.2.0**

Your next release should be: **v0.3.0** (or v0.2.1 for a patch)
