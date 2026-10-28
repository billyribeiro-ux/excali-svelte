/**
 * Build-time classification of the client bundle, produced by the
 * `lazyChunksPlugin` in `vite.config.ts` and consumed by the service worker
 * through the `virtual:sw-lazy-chunks` module.
 *
 * Every list holds file names relative to the base path, exactly as they
 * appear in `$app/manifest`'s `immutable` list (`_app/immutable/chunks/x.js`).
 *
 * SvelteKit enforces `chunkFileNames`/`assetFileNames`, so chunks have bare
 * hash names and cannot be matched by name like the old
 * `**\/locales/**` / `**\/CodeMirrorEditor-*.js` workbox `globIgnores`.
 * The plugin classifies them from the module graph instead (same technique
 * as the old `lazyChunksPlugin`).
 */
export interface LazyChunkManifest {
  /** `locales/<code>.json` chunks, except `en` and `percentages` */
  locales: string[];
  /** CodeMirrorEditor + `@codemirror/*` + `@lezer/*` */
  codemirror: string[];
  /** `@excalidraw/mermaid-to-excalidraw` and everything only it reaches */
  mermaid: string[];
  /** lazy Firebase SDK subset (`data/firebaseSDK.ts`) */
  firebase: string[];
  /** dynamic entries named `*.chunk` (font subsetting worker, qrcode, ...) */
  chunk: string[];
  /** emitted files larger than the 2.3 MiB precache limit */
  oversized: string[];
}

export const LAZY_CATEGORIES = [
  "mermaid",
  "codemirror",
  "locales",
  "firebase",
  "chunk",
] as const;

export type LazyCategory = (typeof LAZY_CATEGORIES)[number];

export const EMPTY_LAZY_CHUNKS: LazyChunkManifest = {
  locales: [],
  codemirror: [],
  mermaid: [],
  firebase: [],
  chunk: [],
  oversized: [],
};
