# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this project is

A static portfolio website for a DevOps engineer. There is no build step, no npm, no framework — `index.html`, `style.css`, and `main.js` are served directly. The repo itself is the portfolio: the Dockerfile, nginx.conf, and GitHub Actions pipeline are what a technical reviewer is meant to inspect.

## Development commands

```bash
# Local dev — edit files, refresh browser (volume-mounted, no rebuild needed)
docker compose up
# → http://localhost:8080

# One-off build and smoke test
docker build -t devops-landing:local .
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/   # expect 200

# Validate files (same checks the CI validate job runs)
python3 -c "from html.parser import HTMLParser; V=type('V',(HTMLParser,),{}); V().feed(open('index.html').read()); print('HTML OK')"
node --check main.js && echo "JS OK"
docker run --rm -v "$(pwd)/nginx.conf:/etc/nginx/conf.d/test.conf:ro" nginx:1.27-alpine nginx -t
```

## CI/CD pipeline

Four sequential jobs in `.github/workflows/deploy.yml`:

```
validate → docker-build (smoke test + Lighthouse ≥0.85) → security-scan (Trivy CVEs) → deploy (GitHub Pages)
```

Deploy only runs if all three preceding jobs pass. The Lighthouse config is in `.lighthouserc.json`.

## Architecture: CSS theming

All colors are CSS custom properties in `:root` (dark defaults). Light theme is defined twice — once in `[data-theme="light"]` for explicit overrides, and once inside `@media (prefers-color-scheme: light) :root:not([data-theme="dark"])` for the system-default case. This intentional duplication is required; there is no preprocessor.

The accent color family uses `--accent-rgb: 96, 165, 250` so that all transparency variants throughout the CSS use `rgba(var(--accent-rgb), X)` rather than hardcoded values — this is what makes the light theme swap work correctly. When changing the accent color, update `--accent`, `--accent-dim`, `--accent-glow`, `--accent-glow-strong`, and `--accent-rgb` together in both `:root` and the two light-theme blocks.

## Architecture: FOUC prevention and CSP

A small inline `<script>` in `<head>` reads `localStorage` and sets `data-theme` before any CSS renders, preventing a flash of wrong theme. This script's exact SHA-256 hash is hardcoded in the `Content-Security-Policy` header in `nginx.conf`:

```
sha256-aWUsQZHEVflDdY7K2hwBThFMNk/PKovqC23wEvSeGUI=
```

**If the inline script changes, you must recompute and update the hash in nginx.conf:**
```bash
python3 -c "
import hashlib, base64
script = open('index.html').read()
import re; s = re.search(r'<script>(.*?)</script>', script).group(1)
print('sha256-' + base64.b64encode(hashlib.sha256(s.encode()).digest()).decode())
"
```

## Architecture: nginx `add_header` inheritance

In nginx, any `add_header` directive inside a `location` block causes that block to stop inheriting headers from the parent `server` block. To avoid security headers being silently dropped for CSS/JS responses, all `add_header` directives live exclusively at the `server` block level. Cache-Control variation per resource type is handled via a `map $uri $cache_ctl` block outside the server block. **Never add `add_header` inside a `location` block.**

## CDN dependencies

Both CDN links are version-pinned with Subresource Integrity (SRI) hashes. Do not change `devicon@v2.16.0` to `@latest`.

| Resource | Version | SRI |
|----------|---------|-----|
| devicons | v2.16.0 (jsDelivr GitHub) | `sha384-DjehTlU5Sub...` |
| Font Awesome | 6.5.0 (cdnjs) | `sha384-/o6I2CkkWC//...` |

If upgrading a CDN dependency, recompute the SRI hash:
```bash
curl -sL <url> | openssl dgst -sha384 -binary | openssl base64 -A
```

## Cache-busting

`style.css` and `main.js` are referenced in `index.html` with a `?v=N` query param (`?v=2` currently). CSS/JS are served with `Cache-Control: immutable` (1-year). Bump `?v=N` in the HTML whenever either file changes, so users behind the Docker image don't get stale assets.

## JavaScript modules

`main.js` is structured as a sequence of self-invoking function expressions, one per feature. Execution order matters for a few features:
- `initTheme()` must run before DOM-dependent modules so `data-theme` is applied immediately.
- `initScrollSpy()` uses `IntersectionObserver` on `section[id]` and `footer[id]` elements to set `.active` on `.nav-links a` — the nav links must have matching `href="#id"` values.
- `initDurations()` reads `data-start` and `data-end` attributes on `.timeline-date` elements (format: `YYYY-MM` or `"present"`) and inserts a `.timeline-duration` span after each one.

## Icon styles

Font Awesome icons that need the accent color use `class="icon-accent"` (defined in CSS as `color: var(--accent)`), not inline `style` attributes. Inline `style` attributes are blocked by the CSP.
