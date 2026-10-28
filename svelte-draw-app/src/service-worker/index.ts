/**
 * svelte-draw service worker (SvelteKit native; replaces the old
 * `vite-plugin-pwa` / workbox `generateSW` setup).
 *
 * - precache: app shell + hashed build output, minus fonts, locale chunks,
 *   mermaid, CodeMirror, Firebase, `*.chunk` and files > 2.3 MiB (`precache.ts`)
 * - runtime caching: woff2 / fonts.css / locales / lazy chunks (`routing.ts`,
 *   rules in `config.ts`, eviction in `expiration.ts`)
 * - offline-first navigation: same-origin navigations get the precached
 *   prerendered shell
 * - web share target: POST `/web-share-target` is stored for the editor
 *   (`share-target.ts`)
 * - update: `skipWaiting()` on install + `clients.claim()` on activate, and
 *   precache caches of other versions are deleted on activate
 *
 * All decisions live in the pure sibling modules, which are unit-tested.
 */
import { version } from "$app/env";
import { assets, immutable, prerendered } from "$app/manifest";
import { resolve } from "$app/paths";
import { self } from "$app/service-worker";
import lazyChunks from "virtual:sw-lazy-chunks";

import {
  ALL_RUNTIME_RULES,
  EXPIRY_META_CACHE,
  SHARE_TARGET_PATH,
  isStaleCache,
  precacheCacheName,
  type RuntimeRule,
} from "./config.ts";
import { isExpired, planExpiration } from "./expiration.ts";
import { planPrecache } from "./precache.ts";
import { classifyRequest, type RoutingContext } from "./routing.ts";
import { handleShareTarget } from "./share-target-handler.ts";
import { isShareTargetRequest } from "./share-target.ts";

type ResolveInput = Parameters<typeof resolve>[0];
const resolvePath = (path: string) => resolve(path as ResolveInput);

const PRECACHE = precacheCacheName(version);
const SHELL = resolvePath("");
const SHARE_ACTION = resolvePath(SHARE_TARGET_PATH);

const plan = planPrecache({ immutable, assets, prerendered }, lazyChunks, resolvePath);

const routing: RoutingContext = {
  origin: self.location.origin,
  precached: new Set(plan.urls),
  lazy: lazyChunks,
  immutablePrefix: resolvePath("_app/immutable/"),
  navigationDenylist: [SHARE_ACTION],
};

// --- expiration bookkeeping -------------------------------------------------
// Cache API entries carry no timestamps, so each runtime-cached response gets a
// small record in `EXPIRY_META_CACHE`, keyed by rule + URL.

const metaRequest = (rule: RuntimeRule, url: string) =>
  new Request(
    new URL(
      `__sw-expiry/${rule.name}/${encodeURIComponent(url)}`,
      self.registration.scope,
    ),
  );

const metaPrefix = (rule: RuntimeRule) =>
  new URL(`__sw-expiry/${rule.name}/`, self.registration.scope).href;

async function readCachedAt(rule: RuntimeRule, url: string) {
  const meta = await caches.open(EXPIRY_META_CACHE);
  const response = await meta.match(metaRequest(rule, url));
  return response ? Number(await response.text()) : null;
}

async function enforceExpiration(rule: RuntimeRule) {
  const meta = await caches.open(EXPIRY_META_CACHE);
  const prefix = metaPrefix(rule);
  const entries = [];
  for (const key of await meta.keys()) {
    if (!key.url.startsWith(prefix)) continue;
    const response = await meta.match(key);
    if (!response) continue;
    entries.push({
      url: decodeURIComponent(key.url.slice(prefix.length)),
      cachedAt: Number(await response.text()),
    });
  }
  const evict = planExpiration(entries, Date.now(), rule);
  if (evict.length === 0) return;
  const cache = await caches.open(rule.cacheName);
  await Promise.all(
    evict.flatMap((url) => [
      cache.delete(url),
      meta.delete(metaRequest(rule, url)),
    ]),
  );
}

async function store(rule: RuntimeRule, request: Request, response: Response) {
  if (!rule.statuses.includes(response.status)) return;
  const cache = await caches.open(rule.cacheName);
  await cache.put(request, response);
  const meta = await caches.open(EXPIRY_META_CACHE);
  await meta.put(metaRequest(rule, request.url), new Response(String(Date.now())));
  await enforceExpiration(rule);
}

// --- strategies ---------------------------------------------------------------

async function cacheFirst(event: FetchEvent, rule: RuntimeRule) {
  const cache = await caches.open(rule.cacheName);
  const cached = await cache.match(event.request);
  if (cached) {
    const cachedAt = await readCachedAt(rule, event.request.url);
    if (cachedAt === null || !isExpired(cachedAt, Date.now(), rule.maxAgeSeconds)) {
      return cached;
    }
  }
  const response = await fetch(event.request);
  event.waitUntil(store(rule, event.request, response.clone()));
  return response;
}

async function staleWhileRevalidate(event: FetchEvent, rule: RuntimeRule) {
  const cache = await caches.open(rule.cacheName);
  const cached = await cache.match(event.request);
  const network = fetch(event.request).then((response) => {
    event.waitUntil(store(rule, event.request, response.clone()));
    return response;
  });
  if (cached) {
    // keep the worker alive for the refresh, but never surface its failure
    event.waitUntil(network.catch(() => undefined));
    return cached;
  }
  return network;
}

async function fromPrecache(request: Request) {
  const cache = await caches.open(PRECACHE);
  return (await cache.match(new URL(request.url).pathname)) ?? fetch(request);
}

async function appShell(request: Request) {
  const cache = await caches.open(PRECACHE);
  // `?web-share-target`, `?room=...` etc. all map to the one prerendered shell
  const shell = await cache.match(SHELL, { ignoreSearch: true });
  return shell ?? fetch(request);
}

// --- share target -------------------------------------------------------------

// --- lifecycle ----------------------------------------------------------------

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(PRECACHE);
      await cache.addAll(plan.urls);
      // activate as soon as the precache is complete (vite-plugin-pwa
      // `registerType: "autoUpdate"` behaviour)
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys()) {
        if (isStaleCache(key, version)) await caches.delete(key);
      }
      await Promise.all(ALL_RUNTIME_RULES.map(enforceExpiration));
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (isShareTargetRequest(request.method, url.pathname, SHARE_ACTION)) {
    event.respondWith(
      handleShareTarget(request, {
        caches,
        redirect: (to, status) => Response.redirect(to, status),
        shellPathname: SHELL,
        log: (message, error) =>
          console.error(`[service-worker] ${message}`, error),
      }),
    );
    return;
  }
  if (request.method !== "GET") return;

  const decision = classifyRequest(url, request.mode, routing);
  switch (decision.kind) {
    case "precache":
      event.respondWith(fromPrecache(request));
      return;
    case "navigate":
      event.respondWith(appShell(request));
      return;
    case "runtime":
      event.respondWith(
        decision.rule.strategy === "CacheFirst"
          ? cacheFirst(event, decision.rule)
          : staleWhileRevalidate(event, decision.rule),
      );
      return;
    case "ignore":
      return;
  }
});
