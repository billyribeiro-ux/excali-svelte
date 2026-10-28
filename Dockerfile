# syntax=docker/dockerfile:1

# ---- build stage -----------------------------------------------------------
# Node 26 is the LTS line (26.13.0 on 2026-10-28). The exact 26.13.0 image was not
# on Docker Hub yet, so this follows the 26 tag; pin 26.13.0-alpine once it exists.
FROM node:26-alpine AS build

# pnpm is provisioned by corepack from the "packageManager" pin in package.json.
# HUSKY=0: the `prepare` script must not try to install git hooks in the image.
ENV HUSKY=0 \
    CI=true

WORKDIR /app
RUN corepack enable

COPY . .

RUN --mount=type=cache,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

RUN pnpm build

# ---- runtime stage ---------------------------------------------------------
FROM nginx:stable-alpine-slim

COPY infra/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/svelte-draw-app/build /usr/share/nginx/html

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=3s CMD wget -q -O /dev/null http://127.0.0.1/ || exit 1
