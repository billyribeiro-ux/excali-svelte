# Guidelines

## Repository

pnpm-workspaces monorepo (Node >= 24.22.1, pnpm 12.15.0; no yarn/npm):

- `svelte-draw-app/` - SvelteKit 3 static app (adapter-static, Svelte 5, Vite 8). App code in `src/lib/app`, routes in `src/routes`.
- `packages/editor/` - `@svelte-draw/editor`, the Svelte 5 editor (`SvelteDraw` component). Core in `components/App.ts` (plain TS class on top of
  `editor/Editor.ts`), view in `components/{EditorHost,EditorView}.svelte` + `components/canvases/*.svelte`, render model in `components/renderModel.ts`.
- `packages/{common,element,math,utils,fractional-indexing,laser-pointer}` - framework-neutral libraries (`@svelte-draw/*`).
- `docs/` - `ARCHITECTURE.md`, `SVELTE_PORT_GUIDE.md`, `MIGRATION_INVENTORY.md`, `COLLABORATION.md`, `DEPLOYMENT.md`.

## Code rules

- For new DOM/browser API usage, use `app.ownerDocument` and `app.ownerWindow` instead of globals; without `app`, derive them from the mounted node's `ownerDocument` and its `defaultView`.
- When overriding properties of an existing type, prefer `Merge<Base, Overrides>` from `@svelte-draw/common/utility-types` over `Omit<Base, keyof Overrides> & Overrides`.
- No React, `jotai`, `radix-ui` or `tunnel-rat` imports; follow `docs/SVELTE_PORT_GUIDE.md` (runes, snippets, `{@attach}`, `bits-ui`).
- Keep class names, `data-testid`, `aria-*` and existing `.scss` files; never weaken or delete tests to get green.
- Do not add `window.confirm/alert/prompt` in new code; use the project's dialog components.

## Svelte MCP (required for `.svelte` / `.svelte.ts`)

1. `list-sections`, then `get-documentation` for the sections you touch, before writing.
2. Write the code.
3. Run `svelte-autofixer` on every file you changed until it reports nothing (justified suggestions about `bind:this` or effects talking to external systems may be ignored).

## Commands

```bash
pnpm install
pnpm dev | pnpm build | pnpm preview
pnpm check                      # svelte-kit sync + svelte-check for svelte-draw-app
pnpm test                       # full vitest run (use sparingly)
pnpm exec vitest run <file-or-dir>                                        # targeted tests (preferred)
pnpm exec svelte-check --tsconfig ./tsconfig.json --output machine 2>&1 | grep "<your path>"
```

Test what changed; run the full suite once before pushing. `pnpm lint` / `pnpm format` configs are planned, not in place yet.
Do not edit `package.json`, lockfiles, `tsconfig*.json`, or `vitest.config.mts` unless the task is about them.
