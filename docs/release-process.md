# Release Process

This document describes the release process for MyMemoryCard.

## Overview

MyMemoryCard uses [release-please](https://github.com/googleapis/release-please) for automated release management. Backend and frontend are versioned independently but released together in a single PR.

- **Tags**: `backend-v1.2.3`, `frontend-v1.2.3`
- **Docker Images**: `ghcr.io/dalssaso/mymemorycard/backend:1.2.3`
- **Pre-releases**: `1.2.0-alpha.1`, `1.2.0-beta.1`, `1.2.0-rc.1`

## Release Types

### Automatic Releases (Recommended)

Release-please automatically:

1. Analyzes conventional commits on `main`
2. Creates/updates a combined release PR with changelog
3. When merged, creates GitHub releases and triggers Docker builds

**Commit conventions:**

| Prefix                         | Version Bump           | Example                           |
| ------------------------------ | ---------------------- | --------------------------------- |
| `feat:`                        | Minor (1.1.0 -> 1.2.0) | `feat: add game filtering`        |
| `fix:`                         | Patch (1.1.0 -> 1.1.1) | `fix: resolve import error`       |
| `perf:`                        | Patch                  | `perf: optimize database queries` |
| `feat!:` or `BREAKING CHANGE:` | Major (1.1.0 -> 2.0.0) | `feat!: redesign API`             |

**Scope for component-specific changes:**

- `feat(backend): add new endpoint`
- `fix(frontend): resolve rendering issue`

### Pre-releases (Manual)

For testing before official release, use the **Docker Build and Publish** workflow:

1. Go to **Actions** > **Docker Build and Publish**
2. Select component (backend/frontend)
3. Enter a pre-release version (e.g., `1.2.0-alpha.1`)
4. Run workflow

Pre-release images are tagged with the exact pre-release version (for example: `1.2.0-alpha.1`).

**Pre-release progression:**

```
1.2.0-alpha.1 -> 1.2.0-alpha.2 -> 1.2.0-beta.1 -> 1.2.0-rc.1 -> 1.2.0
```

## Docker Image Tags

Each stable release creates these tags:

| Tag      | Description                           | Example  |
| -------- | ------------------------------------- | -------- |
| `X.Y.Z`  | Exact version                         | `1.2.3`  |
| `X.Y`    | Minor version (updated on each 1.2.x) | `1.2`    |
| `X`      | Major version (updated on each 1.x.x) | `1`      |
| `latest` | Most recent stable release            | `latest` |

Pre-releases only get their exact version tag (e.g., `1.2.0-alpha.1`).

## Deployment

### Using Specific Versions

Edit your `.env` file in the `deploy/` directory:

```bash
# Pinned versions
BACKEND_VERSION=1.2.3
FRONTEND_VERSION=1.2.3
```

Or override inline:

```bash
BACKEND_VERSION=1.2.3 FRONTEND_VERSION=1.2.3 docker compose up -d
```

### Using Latest

```bash
# Pull latest images
docker compose pull

# Start services
docker compose up -d
```

### Testing Pre-Releases

```bash
BACKEND_VERSION=1.2.0-alpha.1 docker compose up -d backend
```

## Release Workflow

### Standard Release

```
1. Merge PRs to main with conventional commits
   └── feat: add game search
   └── fix: resolve login issue

2. Release-please creates/updates release PR
   └── Updates CHANGELOG.md
   └── Bumps version in package.json
   └── Updates .release-please-manifest.json

3. Review and merge release PR
   └── Creates GitHub release with tag
   └── Triggers Docker build workflow

4. Docker images published to ghcr.io
   └── Multi-platform: amd64, arm64
   └── Security scan with Trivy
```

### Hotfix Process

1. Create branch from `main`:

   ```bash
   git checkout -b fix/critical-bug
   ```

2. Make fix with conventional commit:

   ```bash
   git commit -m "fix: critical security issue"
   ```

3. Open PR to `main`

4. After merge, release-please creates a patch release PR

5. Merge release PR to publish

## Rollback

### Check Available Versions

```bash
# List local images
docker image ls ghcr.io/dalssaso/mymemorycard/backend

# Check GitHub packages for all versions
# Visit: https://github.com/dalssaso/MyMemoryCard/pkgs/container/mymemorycard%2Fbackend
```

### Perform Rollback

```bash
# Edit .env to specify version
BACKEND_VERSION=1.1.0
FRONTEND_VERSION=1.1.0

# Or inline
BACKEND_VERSION=1.1.0 docker compose up -d backend

# Verify
docker compose ps
```

## Troubleshooting

### Release PR Not Created

1. Check commits follow conventional format:

   ```bash
   git log --oneline main~5..main
   ```

2. Verify workflow ran:
   - Go to Actions > Release Please
   - Check for errors in the workflow run

3. Ensure commits are on `main` branch (not feature branches)

### Docker Build Failed

1. Check the Actions tab for build logs

2. Common issues:
   - Dockerfile syntax errors
   - Missing dependencies
   - Platform-specific failures (arm64)

3. Retry the workflow if it was a transient failure

### Version Mismatch

If manifest and package.json versions diverge:

1. Manually sync `.release-please-manifest.json`:

   ```json
   {
     "frontend": "1.2.0",
     "backend": "1.2.0"
   }
   ```

2. Commit with:
   ```bash
   git commit -m "chore: sync manifest versions"
   ```

### Pre-release Validation Failed

If the manual pre-release workflow fails:

- Ensure the version string is valid (e.g., `1.2.0-alpha.1`)
- Verify the component selection matches the intended image

## Configuration Files

| File                                   | Purpose                     |
| -------------------------------------- | --------------------------- |
| `release-please-config.json`           | Release automation config   |
| `.release-please-manifest.json`        | Current version tracker     |
| `backend/package.json`                 | Backend version source      |
| `frontend/package.json`                | Frontend version source     |
| `.github/workflows/release-please.yml` | Automatic release workflow  |
| `.github/workflows/docker.yml`         | Docker build workflow       |
| `.github/workflows/docker.yml`         | Manual image build workflow |

## Additional Resources

- [Release Please Documentation](https://github.com/googleapis/release-please)
- [Conventional Commits](https://www.conventionalcommits.org/)
- [Semantic Versioning](https://semver.org/)
- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
