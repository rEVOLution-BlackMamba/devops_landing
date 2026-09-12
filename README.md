# Luis Angel — DevOps Portfolio

[![Deploy](https://github.com/rEVOLution-BlackMamba/devops_landing/actions/workflows/deploy.yml/badge.svg)](https://github.com/rEVOLution-BlackMamba/devops_landing/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![GHCR](https://img.shields.io/badge/GHCR-devops--landing-blue?logo=docker)](https://github.com/rEVOLution-BlackMamba/devops_landing/pkgs/container/devops_landing)
[![SLSA Level 2](https://img.shields.io/badge/SLSA-Level%202-orange)](https://github.com/rEVOLution-BlackMamba/devops_landing/attestations)
[![OpenSSF Scorecard](https://api.scorecard.dev/projects/github.com/rEVOLution-BlackMamba/devops_landing/badge)](https://scorecard.dev/viewer/?uri=github.com/rEVOLution-BlackMamba/devops_landing)

> Live at **[revolution-blackmamba.github.io/devops_landing](https://revolution-blackmamba.github.io/devops_landing)**

A portfolio site for a DevOps / Cloud / Platform Engineer — but the *repo* is the portfolio.
The source shows production-grade practices applied to a minimal project: multi-stage Docker
builds, hardened nginx, strict CSP, multi-platform images, supply chain security, and a full
GitOps pipeline with quality gates at every stage.

---

## Architecture

```
index.html + style.css + main.js
        │
        ├── Dockerfile          multi-stage: alpine:3.20 (validate) → nginx:1.27-alpine (serve)
        ├── nginx.conf          security headers · CSP · gzip · rate limiting · JSON access log
        ├── docker-compose.yml  local dev (read-only FS, resource limits, tmpfs mounts)
        ├── Makefile            make up / build / smoke / lint / clean
        ├── test/               zero-dependency unit tests for main.js (node --test)
        └── .github/workflows/
            ├── deploy.yml      4-job pipeline → GHCR → GitHub Pages
            ├── codeql.yml      JavaScript SAST (weekly + on push)
            ├── scorecard.yml   OpenSSF Scorecard supply-chain analysis (weekly)
            └── uptime.yml      synthetic check of the live site every 30 min
```

## CI/CD Pipeline

```
validate ──► build-publish ──► security-scan ──► deploy
             + smoke test        (Trivy on         (GitHub Pages)
             + Lighthouse CI      GHCR digest)
             + GHCR push
             + SBOM + SLSA
             + Cosign sign
```

| Job | What it does |
|-----|-------------|
| **validate** | File existence · HTML/CSS/JS syntax · `main.js` unit tests (`node --test`) · Dockerfile lint (Hadolint) · Gitleaks secrets scan |
| **build-publish** | amd64 local build → smoke test → Lighthouse ≥85 (incl. accessibility ≥95) → pa11y-ci WCAG2AA audit → multi-platform GHCR push (`linux/amd64` + `linux/arm64`) → SLSA provenance attestation → Cosign keyless sign |
| **security-scan** | Trivy CVE scan on the published GHCR image by immutable digest (no rebuild) |
| **deploy** | Upload static files to GitHub Pages |

## Supply chain security

Every push to `main` produces a signed, multi-platform image in GHCR with a SLSA Level 2
provenance attestation and a BuildKit SBOM attached to the image manifest.

```bash
# Verify the image signature (requires cosign CLI)
cosign verify \
  --certificate-identity-regexp="https://github.com/rEVOLution-BlackMamba/devops_landing/.github/workflows/deploy.yml" \
  --certificate-oidc-issuer="https://token.actions.githubusercontent.com" \
  ghcr.io/revolution-blackmamba/devops_landing:latest

# Pull a specific platform
docker pull --platform linux/arm64 ghcr.io/revolution-blackmamba/devops_landing:latest
```

## Live monitoring

[`uptime.yml`](.github/workflows/uptime.yml) probes the live Pages URL every 30 minutes,
auto-files a `uptime`-labeled GitHub issue on the first failure (deduped — never more than one
open at a time), and auto-closes it with a comment as soon as the site recovers. It pairs with
the structured JSON access logs (`json_combined` format in `nginx.conf`) that ship to stdout —
one watches the edge from the outside, the other captures what happens once a request lands.

## Local dev

```bash
git clone https://github.com/rEVOLution-BlackMamba/devops_landing.git
cd devops_landing

make up      # docker compose up → http://localhost:8080 (live-reload)
make lint    # validate HTML, JS, nginx.conf
make test    # run main.js unit tests (zero-dependency, node --test + a hand-rolled DOM shim)
make smoke   # build + HTTP 200 check + teardown
make clean   # stop and remove local image

# Optional: git hook setup (trailing whitespace, YAML, secrets scan)
pip install pre-commit && pre-commit install
```

## Stack

Pure **HTML + CSS + JS**, zero build tools, zero npm, zero runtime dependencies.
CDNs: Google Fonts · devicons v2.16.0 (SRI-pinned) · Font Awesome 6.5.0 (SRI-pinned).

## One-time GitHub setup

1. Push to `main`
2. **Settings → Pages → Source → GitHub Actions**
3. Re-run the workflow — the live URL appears in the deploy job output
4. **Packages → devops_landing → Package settings → set to Public** (for Cosign verify to work)
5. **Issues → Labels → New label** — create an `uptime` label (used by `uptime.yml` to track
   and dedupe auto-filed downtime incidents)

---

*© Luis Angel · luis.bastida@proton.me · [linkedin.com/in/luis-angel-b014bb2b2](https://linkedin.com/in/luis-angel-b014bb2b2)*
