# Stage 1 — validate static assets exist and are non-empty
FROM alpine:3.24@sha256:28bd5fe8b56d1bd048e5babf5b10710ebe0bae67db86916198a6eec434943f8b AS validator
WORKDIR /src
COPY index.html style.css main.js favicon.svg robots.txt sitemap.xml ./
COPY .well-known ./.well-known/
RUN test -s index.html && test -s style.css && test -s main.js && test -s favicon.svg \
    && test -s robots.txt && test -s sitemap.xml && test -s .well-known/security.txt \
    && echo "Static assets validated."

# Stage 2 — serve with hardened nginx
FROM nginx:1.31-alpine@sha256:72ba65eb42c10344912a84ff42408db7d34f2feb642204570ab8fc5ffd29f1d3

LABEL maintainer="luis.bastida@proton.me"
LABEL org.opencontainers.image.title="devops-landing"
LABEL org.opencontainers.image.description="Luis Angel — DevOps Portfolio"
LABEL org.opencontainers.image.source="https://github.com/rEVOLution-BlackMamba/devops_landing"

# Pulls in Alpine's latest patched packages at build time — the upstream
# nginx:1.31-alpine layers are only rebuilt periodically, so pinned OS
# packages (e.g. util-linux/libuuid) can lag behind already-fixed CVEs.
RUN apk update && apk upgrade --no-cache

RUN rm /etc/nginx/conf.d/default.conf
COPY nginx.conf /etc/nginx/conf.d/default.conf

COPY --from=validator /src/index.html   /usr/share/nginx/html/
COPY --from=validator /src/style.css    /usr/share/nginx/html/
COPY --from=validator /src/main.js      /usr/share/nginx/html/
COPY --from=validator /src/favicon.svg  /usr/share/nginx/html/
COPY --from=validator /src/robots.txt   /usr/share/nginx/html/
COPY --from=validator /src/sitemap.xml  /usr/share/nginx/html/
COPY --from=validator /src/.well-known  /usr/share/nginx/html/.well-known/

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD ["sh", "-c", "wget -qO- http://127.0.0.1/ || exit 1"]

CMD ["nginx", "-g", "daemon off;"]
