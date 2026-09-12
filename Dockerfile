# Stage 1 — validate static assets exist and are non-empty
FROM alpine:3.20 AS validator
WORKDIR /src
COPY index.html style.css main.js favicon.svg robots.txt sitemap.xml ./
COPY .well-known ./.well-known/
RUN test -s index.html && test -s style.css && test -s main.js && test -s favicon.svg \
    && test -s robots.txt && test -s sitemap.xml && test -s .well-known/security.txt \
    && echo "Static assets validated."

# Stage 2 — serve with hardened nginx
FROM nginx:1.27-alpine

LABEL maintainer="luis.bastida@proton.me"
LABEL org.opencontainers.image.title="devops-landing"
LABEL org.opencontainers.image.description="Luis Angel — DevOps Portfolio"
LABEL org.opencontainers.image.source="https://github.com/rEVOLution-BlackMamba/devops_landing"

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
  CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
