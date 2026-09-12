# Security Policy

> A machine-readable version of this contact info is published per [RFC 9116](https://www.rfc-editor.org/rfc/rfc9116)
> at [`/.well-known/security.txt`](.well-known/security.txt).

## Supported Versions

This is a portfolio/static site. Only the `main` branch receives security fixes.

## Reporting a Vulnerability

If you discover a security issue in this repository — including the Dockerfile,
nginx configuration, CI/CD pipeline, or site content — please report it privately.

**Contact:** luis.bastida@proton.me

Please include a description of the issue, its potential impact, steps to reproduce,
and any suggested mitigations. Do not open a public GitHub issue for security vulnerabilities.

I will acknowledge receipt within 72 hours and aim to resolve valid reports within 14 days.

## Scope

| In scope | Out of scope |
|----------|-------------|
| Dockerfile / nginx.conf misconfigurations | GitHub Pages hosting infrastructure |
| CI/CD pipeline security (deploy.yml) | CDN availability (jsDelivr, cdnjs) |
| Dependency vulnerabilities (images, Actions) | Content-only feedback |
| Container escape / privilege escalation | |

## Security Features

- Multi-stage Docker build with minimal attack surface
- nginx hardening: CSP, X-Frame-Options, `server_tokens off`, rate limiting
- Read-only container filesystem with tmpfs mounts and resource limits
- Trivy CVE scanning on every push (HIGH/CRITICAL block deploy)
- Gitleaks secrets scanning in CI and pre-commit hook
- SBOM + SLSA provenance attestation on all published images
- Cosign keyless image signing via Sigstore
- Dependabot for GitHub Actions and Docker base images
