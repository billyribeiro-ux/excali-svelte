import { RUNTIME_RULES, type RuntimeRule } from "./config.ts";
import { lazyCategoryOf } from "./precache.ts";
import type { LazyChunkManifest } from "./lazy-chunks.ts";

export type Decision =
  | { kind: "precache" }
  | { kind: "runtime"; rule: RuntimeRule }
  | { kind: "navigate" }
  | { kind: "ignore" };

export interface RoutingContext {
  /** this worker's origin (`self.location.origin`) */
  origin: string;
  /** absolute pathnames in the precache (see `planPrecache`) */
  precached: ReadonlySet<string>;
  lazy: LazyChunkManifest;
  /** absolute pathname prefix of Vite output, e.g. `/_app/immutable/` */
  immutablePrefix: string;
  /** absolute pathname prefixes never answered with the app shell */
  navigationDenylist: readonly string[];
}

/**
 * Map an immutable-asset pathname back to the manifest-relative form used by
 * `LazyChunkManifest` by stripping the (resolved) base.
 */
const toRelative = (pathname: string, immutablePrefix: string) => {
  const marker = "_app/immutable/";
  const index = immutablePrefix.lastIndexOf(marker);
  const base = immutablePrefix.slice(0, index);
  return pathname.startsWith(base) ? pathname.slice(base.length) : pathname;
};

/**
 * Decide how a GET request is handled. Order mirrors the old workbox config:
 * precache first, then the runtime rules in their declared order, then the
 * navigation fallback, otherwise the request is left to the network.
 */
export const classifyRequest = (
  url: URL,
  mode: RequestMode | "navigate",
  ctx: RoutingContext,
): Decision => {
  const sameOrigin = url.origin === ctx.origin;
  const { pathname } = url;

  if (sameOrigin && ctx.precached.has(pathname)) return { kind: "precache" };

  // fonts: any origin (assets may be hosted on a CDN, hence status 0)
  if (pathname.endsWith(".woff2")) {
    return { kind: "runtime", rule: RUNTIME_RULES.woff2 };
  }
  if (/(?:^|\/)fonts\.css$/.test(pathname)) {
    return { kind: "runtime", rule: RUNTIME_RULES.fontsCss };
  }

  if (sameOrigin && pathname.startsWith(ctx.immutablePrefix)) {
    if (pathname.endsWith(".js")) {
      const category = lazyCategoryOf(
        toRelative(pathname, ctx.immutablePrefix),
        ctx.lazy,
      );
      if (category === "locales") {
        return { kind: "runtime", rule: RUNTIME_RULES.locales };
      }
      if (category === "codemirror" || category === "chunk") {
        return { kind: "runtime", rule: RUNTIME_RULES.chunk };
      }
      // mermaid, firebase and any other non-precached lazy chunk
      return { kind: "runtime", rule: RUNTIME_RULES.lazyChunks };
    }
    return { kind: "ignore" };
  }

  if (
    sameOrigin &&
    mode === "navigate" &&
    !ctx.navigationDenylist.some((prefix) => pathname.startsWith(prefix))
  ) {
    return { kind: "navigate" };
  }

  return { kind: "ignore" };
};
