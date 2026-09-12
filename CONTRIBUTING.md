# Contributing

## Prerequisites

- Docker with Buildx (`docker buildx version`)
- Node.js (for `node --check` JS syntax validation)
- Python 3 (for HTML validation in `make lint`)
- Optional: `pre-commit` for local git hooks (strongly recommended)

## Quick start

```bash
git clone https://github.com/rEVOLution-BlackMamba/devops_landing.git
cd devops_landing
make up          # → http://localhost:8080 with live-reload
```

## Pre-commit setup

```bash
pip install pre-commit
pre-commit install
```

Hooks run automatically on `git commit`: trailing whitespace, YAML validity, and Gitleaks
secrets scan. Run `pre-commit run --all-files` to check the full repo at any time.

## Making changes

| Change | Required follow-up |
|--------|-------------------|
| `style.css` or `main.js` | Bump `?v=N` in `index.html` (cache-busting) |
| `main.js` logic | Run `make test` (zero-dependency unit tests via `node --test`) |
| Inline `<script>` in `<head>` | Recompute CSP SHA-256 hash in `nginx.conf` (see CLAUDE.md) |
| `nginx.conf` | Run `make lint` to validate with `nginx -t` |
| Any file | Run `make smoke` to verify HTTP 200 end-to-end |

## Pull request process

1. Fork, branch, and open a PR — the template at `.github/pull_request_template.md` guides
   you through the checklist.
2. CI runs automatically: validate → build-publish (Lighthouse + GHCR push) → Trivy scan.
3. All jobs must pass before merge.
