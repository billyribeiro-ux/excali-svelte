import fs from "node:fs";
import path from "node:path";

import type { Plugin, Rolldown } from "vite";

import { MAX_PRECACHE_FILE_SIZE } from "./src/service-worker/config.ts";
import {
  EMPTY_LAZY_CHUNKS,
  LAZY_CATEGORIES,
  type LazyCategory,
  type LazyChunkManifest,
} from "./src/service-worker/lazy-chunks.ts";

const VIRTUAL_ID = "virtual:sw-lazy-chunks";
const RESOLVED_VIRTUAL_ID = `\0${VIRTUAL_ID}`;

/**
 * How to recognise the entry point of each lazily loaded group: a chunk that
 * is a dynamic entry (not a static entry) containing a matching module (or
 * matching `name`). Mirrors the old `globIgnores` (locales, `*.chunk-*`,
 * `CodeMirrorEditor-*`, `firebaseSDK-*`) and `lazyChunksPlugin` (mermaid) of
 * `excalidraw-app/vite.config.mts`.
 */
const ROOTS: Record<
  LazyCategory,
  (chunk: Rolldown.OutputChunk, moduleId: (re: RegExp) => boolean) => boolean
> = {
  mermaid: (_chunk, has) =>
    has(/[\\/]node_modules[\\/]@excalidraw[\\/]mermaid-to-excalidraw[\\/]/),
  codemirror: (_chunk, has) =>
    has(/CodeMirrorEditor\.svelte$|[\\/]@codemirror[\\/]|[\\/]@lezer[\\/]/),
  // every locale except `en` and `percentages`, which the first load needs
  locales: (_chunk, has) =>
    has(
      /[\\/]packages[\\/]editor[\\/]locales[\\/](?!en\.json$|percentages\.json$)[^\\/]+\.json$/,
    ),
  firebase: (_chunk, has) => has(/[\\/]data[\\/]firebaseSDK\.ts$/),
  chunk: (chunk) => /\.chunk$/.test(chunk.name),
};

const toPosix = (file: string) => file.split(path.sep).join("/");

const byteLength = (output: Rolldown.OutputChunk | Rolldown.OutputAsset) =>
  output.type === "chunk"
    ? Buffer.byteLength(output.code)
    : typeof output.source === "string"
      ? Buffer.byteLength(output.source)
      : output.source.byteLength;

/**
 * SvelteKit enforces `chunkFileNames`/`assetFileNames`, so lazy chunks cannot
 * be recognised by file name. Instead this plugin classifies the client
 * bundle from its module graph and exposes the result to the service worker as
 * `virtual:sw-lazy-chunks` (see `src/service-worker/lazy-chunks.ts`). The
 * service worker is built after the client build, so the data is ready when it
 * is bundled. Also lists emitted/static files above the 2.3 MiB precache limit.
 */
export function lazyChunksPlugin(): Plugin {
  const state: LazyChunkManifest = structuredClone(EMPTY_LAZY_CHUNKS);
  let root = process.cwd();

  const staticOversized = () => {
    const dir = path.resolve(root, "static");
    if (!fs.existsSync(dir)) return [];
    return (fs.readdirSync(dir, { recursive: true, withFileTypes: true }))
      .filter((entry) => entry.isFile())
      .map((entry) => path.join(entry.parentPath, entry.name))
      .filter((file) => fs.statSync(file).size > MAX_PRECACHE_FILE_SIZE)
      .map((file) => toPosix(path.relative(dir, file)));
  };

  return {
    name: "svelte-draw-sw-lazy-chunks",

    configResolved(config) {
      root = config.root;
    },

    resolveId(id) {
      return id === VIRTUAL_ID ? RESOLVED_VIRTUAL_ID : undefined;
    },

    load(id) {
      if (id !== RESOLVED_VIRTUAL_ID) return;
      return `export default ${JSON.stringify({
        ...state,
        oversized: [...state.oversized, ...staticOversized()],
      })};`;
    },

    generateBundle(_options, bundle) {
      if (this.environment.name !== "client") return;

      const chunks = new Map<string, Rolldown.OutputChunk>();
      for (const output of Object.values(bundle)) {
        if (output.type === "chunk") chunks.set(output.fileName, output);
      }

      const rootsOf = (category: LazyCategory) =>
        [...chunks.values()].filter(
          (chunk) =>
            chunk.isDynamicEntry &&
            !chunk.isEntry &&
            ROOTS[category](chunk, (re) =>
              chunk.moduleIds.some((id) => re.test(id)),
            ),
        );

      const roots = Object.fromEntries(
        LAZY_CATEGORIES.map((category) => [category, rootsOf(category)]),
      ) as Record<LazyCategory, Rolldown.OutputChunk[]>;
      const lazyRoots = new Set(
        LAZY_CATEGORIES.flatMap((category) =>
          roots[category].map((chunk) => chunk.fileName),
        ),
      );

      const reachable = (
        start: Rolldown.OutputChunk[],
        followDynamic: (chunk: Rolldown.OutputChunk) => boolean,
      ) => {
        const seen = new Set<string>();
        const stack = [...start];
        while (stack.length) {
          const chunk = stack.pop()!;
          if (seen.has(chunk.fileName)) continue;
          seen.add(chunk.fileName);
          // static imports are needed whenever the importing chunk loads
          for (const name of chunk.imports) {
            const next = chunks.get(name);
            if (next) stack.push(next);
          }
          for (const name of chunk.dynamicImports) {
            const next = chunks.get(name);
            if (next && followDynamic(next)) stack.push(next);
          }
        }
        return seen;
      };

      // anything also reachable without dynamically importing a lazy root
      // (shared deps, or a lazy root merged into a statically imported chunk)
      // has to stay precached
      const reachableOtherwise = reachable(
        [...chunks.values()].filter((chunk) => chunk.isEntry),
        (next) => !lazyRoots.has(next.fileName),
      );

      const assigned = new Set<string>();
      for (const category of LAZY_CATEGORIES) {
        state[category] = [];
        if (roots[category].length === 0) {
          this.warn(`no lazy-loaded chunk found for "${category}"`);
        }
        for (const chunk of roots[category]) {
          if (reachableOtherwise.has(chunk.fileName)) {
            this.warn(
              `${chunk.fileName} ("${category}") is reachable without a dynamic import, so it stays precached`,
            );
          }
        }
        for (const fileName of reachable(roots[category], () => true)) {
          if (!reachableOtherwise.has(fileName) && !assigned.has(fileName)) {
            assigned.add(fileName);
            state[category].push(fileName);
          }
        }
      }

      state.oversized = Object.values(bundle)
        .filter((output) => byteLength(output) > MAX_PRECACHE_FILE_SIZE)
        .map((output) => output.fileName);
    },
  };
}
