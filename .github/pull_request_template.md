## Summary

<!-- What does this PR change and why? -->

## Checklist

- [ ] Tested locally with `make smoke` or `docker compose up`
- [ ] `make lint` passes (HTML, JS, nginx.conf)
- [ ] `?v=N` bumped in `index.html` if `style.css` or `main.js` changed
- [ ] CSP hash updated in `nginx.conf` if inline `<script>` in `index.html` changed
- [ ] No secrets or credentials in the diff
