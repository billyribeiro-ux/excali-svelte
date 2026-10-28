# svelte-draw migration inventory

Source: Excalidraw 0.18.0 (`packages/editor/package.json`), Yarn 1.22.22 monorepo, no git history available locally. Baseline: `_baseline/` copy, `pnpm exec vitest run` → 148 files / 2565 tests passed, 47 skipped, 1 todo (Node 24.22.0, pnpm 12.14.0, vitest 3.0.6, 2026-10-26).

Status values: OBSERVED = measured from the files; PLANNED = decision not yet implemented. Nothing below is IMPLEMENTED yet.

## 1. React / jotai / radix coupling (OBSERVED, `/tmp/inv.sh` grep of imports)

| Location | Files | LOC | Plan |
| --- | --- | --- | --- |
| `packages/editor/components` | 149 | 44,443 | port to Svelte 5 |
| `packages/editor/tests` | 38 | 23,965 | port harness (RTL → Svelte testing) |
| `packages/editor/actions` | 5 | 3,133 | decouple from React (action `PanelComponent`s become Svelte) |
| `packages/editor` (root: `index.tsx`, etc.) | 4 | 2,317 | rewrite as Svelte entry |
| `excalidraw-app` (+ `collab`, `components`, `share`, `app-language`) | 17 | 4,419 | port to SvelteKit routes/components |
| `packages/editor/data` | 1 | 1,001 | extract non-React part |
| `packages/editor/hooks` | 12 | 679 | replace by runes / `.svelte.ts` |
| `packages/element` | 1 | 568 | test only (`tests/cropElement.test.tsx`) |
| `examples/with-script-in-browser` | 6 | 1,291 | port or drop (decide later) |
| `common`, `math`, `utils`, `fractional-indexing`, `laser-pointer` | 0 | — | **keep unchanged** |

React API usage across `packages/editor` + `excalidraw-app` (OBSERVED): useEffect 119, useCallback 57, useState 53, useAtom 44, memo 39, useMemo 36, useRef 31, flushSync 19, useLayoutEffect 18, useContext 15, atom 9, useAtomValue 8, useSetAtom 6, forwardRef 6, useImperativeHandle 4, createPortal 2, createIsolation 2. Third-party UI imports: `react` 237, `clsx` 77, `radix-ui` 25, `react-dom` 11, `@testing-library/react` 22, `jotai` 2, `jotai-scope` 2. Class components: `components/App.tsx`, `excalidraw-app/components/TopErrorBoundary.tsx`, `excalidraw-app/collab/Collab.tsx`.

### Correction (OBSERVED while scaffolding svelte-draw-app)

The "0 React imports" count only matched `from "react"` lines. Type-level coupling remains in the "neutral" packages:

- `packages/common/src/utility-types.ts` and `keys.ts` use the global `React` namespace; `packages/element/src/arrows/helpers.ts` and `linearElementEditor.ts` also reference `React.` types.
- 41 files in `common`/`element`/`math`/`utils` import from `@svelte-draw/editor` (mostly `types`, `AppState`, `components/App`), i.e. the neutral packages depend back on the editor package. These types must move into a neutral location in Phase 4.
- Several packages rely on globals declared in `packages/*/global.d.ts` (e.g. `EXCALIDRAW_ASSET_PATH`, `EXCALIDRAW_EXPORT_SOURCE`).

## 2. The editor core: `packages/editor/components/App.tsx` (OBSERVED)

- 11,493 lines, `class App extends React.Component`; 167 `this.setState` and 714 `this.state` references; `render()` at line 2325.
- Already split into plain TypeScript collaborators that take the `App` instance (8,660 LOC): `App.selectionTool` 1549, `App.viewport` 950, `App.text` 912, `App.selection` 756, `App.clipboard` 638, `App.duplicate` 529, `App.textTool` 455, `App.wrap` 395, `App.bucketFill` 301, `App.pan` 288, `App.drawshape` 263, `App.toolDrag` 246, `App.cursor` 243, `App.arrowText` 235, `App.host` 234, `App.flowchart` 198, `App.wheel` 178, `App.modifiers` 82, `AppStateObserver` 208. These import React only for event _types_ (e.g. `App.pan.ts` imports `type React` and `withBatchedUpdates` from `reactUtils`).
- PLANNED approach: introduce a framework-neutral `Editor` base class that provides `state`, `setState(partial | fn, callback)` and lifecycle hooks with the semantics App relies on, then make `App` extend it instead of `React.Component`; the Svelte layer subscribes to the editor's state and renders `LayerUI` and the canvases. The `App.*.ts` collaborators and imperative canvas rendering (`renderer/`, `scene/`, `@svelte-draw/element`) are kept.
- UNVERIFIED: whether `setState` callback ordering and batching (`flushSync` ×19, `withBatchedUpdates`) can be reproduced exactly; needs targeted tests before `App.tsx` is touched.

## 3. Package decisions

| Package | Decision |
| --- | --- |
| `@svelte-draw/common`, `math`, `utils`, `fractional-indexing`, `laser-pointer` | keep (framework-neutral, 0 React imports) |
| `@svelte-draw/element` | keep; port 1 test off React Testing Library |
| `packages/editor` | split: neutral editor core stays TS, UI ports to Svelte |
| `excalidraw-app` | becomes the SvelteKit app |

## 4. Toolchain target (OBSERVED from registry on 2026-10-26; install not yet performed)

Svelte 5.57.2, SvelteKit 3.1.0, Vite 8.3.5, vite-plugin-svelte 7.3.1, TypeScript 6.0.3 (kit peer `^6`; TS 7 excluded), svelte-check 4.7.7, vitest 5.0.5, pnpm 12.15.0, Node 26.13.0 (LTS "Lithium", 2026-10-28). Machine currently has Node 24.22.0 / pnpm 12.14.0.

## 5. Open items

- Replacements needed for: `jotai`/`jotai-scope` (use runes/stores), `radix-ui` (25 imports: pick Svelte-native primitives, e.g. Bits UI — UNVERIFIED version/compat), `@testing-library/react` (→ `@testing-library/svelte`, UNVERIFIED), `vite-plugin-svgr`, `@vitejs/plugin-react`, `eslint-config-react-app`.
- Collaboration backend (Firebase 11.3.1, socket.io-client 4.7.2) is external; live behavior cannot be tested locally.
- Fonts (`public/Virgil.woff2`, `Cascadia.woff2`, `Assistant-Regular.woff2`) and `fonts/` licensing audit: NOT STARTED.
- Sentry (`@sentry/browser` 9.0.1) usage in `excalidraw-app/sentry.ts`: decide keep/remove.

## 6. Foundation status (OBSERVED, 2026-10-26)

`svelte-draw-app/` (SvelteKit 3.1.0, Svelte 5.57.2, Vite 8.3.5, TypeScript 6.0.3, adapter-static 4.0.0):

- `vite.config.ts` holds the kit config (no `svelte.config.js`, per the SvelteKit 3 migration guide); `#lib` declared in `package.json` `imports`.
- Workspace packages resolve from source via `resolve.alias` + tsconfig `paths` (same convention as `excalidraw-app/vite.config.mts`).
- `pnpm run build` → prerendered static site in `svelte-draw-app/build` (adapter-static); page imports `@svelte-draw/common`.
- `pnpm run check` (svelte-check, strict) → 859 files, 0 errors, 0 warnings. tsconfig temporarily sets `jsx: react-jsx` and `verbatimModuleSyntax: false` so the not-yet-ported React/Excalidraw sources can be type-resolved; remove when they are ported.
- `clsx@2.1.1` is pinned in the app because `shamefullyHoist` otherwise exposes clsx 1.1.1 to Svelte's SSR chunk (`excalidraw` pins 1.1.1).
- Root workspace: pnpm 12.15.0 via `packageManager`, `pnpm-workspace.yaml` (shamefullyHoist, allowBuilds), internal deps `workspace:*`. Neutral-package tests (`packages/{common,math,utils,fractional-indexing,laser-pointer,element}`): 50 files, 992 passed / 36 skipped / 1 todo, identical to baseline. Root `tsc`: no errors.
- `yarn.lock` and the Yarn scripts in the root `package.json` are still present; removal is part of Phase 10.
