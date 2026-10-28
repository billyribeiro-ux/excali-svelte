# Deployment

`pnpm build` produces a fully static site in **`svelte-draw-app/build`** (`@sveltejs/adapter-static`, configured in `svelte-draw-app/vite.config.ts`; `src/routes/+layout.ts` sets `prerender = true`). Any static host works as long as unknown paths fall back to `index.html` and hashed assets under `/_app/immutable/` are cacheable.

## Options provided in this repo

| Target | Files | Status |
| --- | --- | --- |
| Docker + nginx | `Dockerfile`, `infra/nginx.conf`, `docker-compose.yml`, `.dockerignore` | **not built or run** (the Docker daemon was not running when these were written); nginx syntax **not validated** (nginx not installed) |
| Vercel | `vercel.json` | JSON syntax checked only; no deployment performed |

### Docker

```bash
docker build -t svelte-draw .
docker run --rm -p 8080:80 svelte-draw      # http://localhost:8080
# or
docker compose up --build                   # same, port 8080
```

The image is multi-stage: `node:26-alpine` (the Node 26 LTS line; pin `26.13.0-alpine` once that image is published) with pnpm provisioned by corepack from the `packageManager` pin, then `pnpm install --frozen-lockfile` and `pnpm build`, then `nginx:stable-alpine-slim` serving the build with `infra/nginx.conf` (installed as `conf.d/default.conf`). Base images are pinned by tag only (no digest was verified). `VITE_*` variables are inlined at **build time**, so pass them as build args/env in the build stage (the Dockerfile does not declare any `ARG`s yet; add `ARG VITE_APP_...` and `ENV` lines for the ones you need).

### nginx / headers

`infra/nginx.conf` (and `vercel.json`) set `X-Content-Type-Options: nosniff`, `Referrer-Policy: origin` and `Cache-Control: public, max-age=31536000, immutable` for `/_app/immutable/*`. The nginx file also sends `no-cache` for `index.html`, `/_app/version.json` and `/service-worker.js` (the latter only matters if the build emits one) and falls back to `index.html` for unknown paths. The old Excalidraw-specific `Access-Control-Allow-Origin: https://excalidraw.com`, `Feature-Policy: *`, and redirects are intentionally gone.

### Vercel

`vercel.json` sets `installCommand` (`pnpm install --frozen-lockfile`), `buildCommand` (`pnpm build`), `outputDirectory` (`svelte-draw-app/build`) and the headers above.

## Environment variables

Read via `import.meta.env` (Vite): set them in the environment (or an untracked `.env.local`) when building. Unset variables are `undefined`; the behaviour per variable, from source:

| Variable | Read in | If unset |
| --- | --- | --- |
| `VITE_APP_WS_SERVER_URL` | `collab/Collab.ts` | no collaboration server; live collaboration cannot connect |
| `VITE_APP_FIREBASE_CONFIG` | `data/firebase.ts` | `JSON.parse` fails, a warning is logged, config becomes `{}`; scene/file persistence for rooms and share-link images fails |
| `VITE_APP_BACKEND_V2_GET_URL`, `VITE_APP_BACKEND_V2_POST_URL` | `data/index.ts` | share-link export/import fetches `undefined...` and fails |
| `VITE_APP_LIBRARY_URL` | `LibraryMenuBrowseButton.svelte` | library browse link has no target |
| `VITE_APP_LIBRARY_BACKEND` | `PublishLibrary.svelte` | publishing a library has no backend |
| `VITE_APP_AI_BACKEND` | `app/components/AI.svelte` | AI features have no backend |
| `VITE_APP_PLUS_LP`, `VITE_APP_PLUS_APP` | app menu, sidebar, welcome screen, promo banner, TTD chat | the places that link to them receive `undefined`; hiding of those UI entries when unset is handled by the rebrand work and is **UNVERIFIED** here |
| `VITE_APP_REPOSITORY_URL` | `app_constants.ts` | falls back to the default in that file; an empty value hides the "GitHub" command (per the comment in source) |
| `VITE_APP_DISABLE_SENTRY` | `app/sentry.ts` | see below |
| `VITE_APP_GIT_SHA` | `app/sentry.ts` | Sentry release left undefined |
| `VITE_APP_ENABLE_TRACKING` | `packages/editor/analytics.ts` | `trackEvent` returns immediately unless the value is exactly `true` (so tracking is off) |
| `VITE_APP_DISABLE_PREVENT_UNLOAD` | `collab/Collab.ts`, wrapper | the before-unload prompt stays enabled |
| `VITE_APP_DEBUG_ENABLE_TEXT_CONTAINER_BOUNDING_BOX` | `packages/element/src/renderElement.ts` | debug box off |

Collaboration, share links, library and AI all require services that this repository does not provide; see [COLLABORATION.md](./COLLABORATION.md).

**Sentry.** At the time of writing, `svelte-draw-app/src/lib/app/sentry.ts` enables reporting only when the page hostname contains `excalidraw.com`, `staging.excalidraw.com` or `vercel.app` and `VITE_APP_DISABLE_SENTRY !== "true"`, and it contains a hard-coded DSN inherited from upstream. If you deploy to a `*.vercel.app` host, set `VITE_APP_DISABLE_SENTRY=true` (or remove that module's DSN) so errors are not sent to a project you do not own.

For the complete list of variables with example values see `svelte-draw-app/.env.example` if it exists in your checkout (it was being created by another change when this document was written).

## Verification status

`pnpm build` output was inspected (`svelte-draw-app/build/index.html`, `_app/immutable/**`, fonts as hashed `.woff2`), but the Docker image, nginx config and Vercel config have not been exercised end to end.
