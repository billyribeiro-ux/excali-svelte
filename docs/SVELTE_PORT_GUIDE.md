# React → Svelte 5 port guide (svelte-draw)

Contract for everyone porting `packages/editor` / `excalidraw-app` UI code. Read it fully before touching a file.
Working tree: `/Users/billyribeiro/dev/excalidraw/excalidraw-master`. Pristine reference copy (React, working tests):
`/Users/billyribeiro/dev/excalidraw/_baseline` — **read-only, never edit it**.

## Non-negotiable rules

1. **Evidence, no assumptions.** Port from the actual React source of the file you are replacing. Cite nothing you did not read.
2. **Genuinely Svelte-native.** No `react`, `react-dom`, `jotai`, `jotai-scope`, `radix-ui`, `tunnel-rat`, `@testing-library/react` imports in anything you write.
   No compat wrappers, no hidden React roots.
3. **Preserve behavior and DOM.** Keep class names, `data-testid`, `aria-*`, `title`, roles, DOM structure, and the existing `.scss` files
   (import them from the component: `import "./Foo.scss";`). Tests and CSS depend on them. Do not redesign.
4. **Never weaken tests.** Port each existing test to the Svelte equivalent with the same assertions. Do not delete or loosen a test to get green;
   do not update snapshots to hide a difference — if a snapshot differs, find out why and report it.
5. **Do not touch** `package.json` files, `pnpm-workspace.yaml`, lockfiles, vitest/vite/tsconfig files, or files you were not assigned.
   Do not run `pnpm install`/`add`. If you need a dependency or a shared helper that does not exist, report it instead of inventing it.
6. **No git operations.** There is no repo. Do not create backups beside the sources.
7. **Honest reporting.** State what you ported, what you ran (exact commands + results), what is incomplete or `UNVERIFIED`.

## Mandatory tool flow for every `.svelte` / `.svelte.ts` file

1. Svelte MCP: `mcp__svelte__list-sections` → `mcp__svelte__get-documentation` for the sections your change touches (runes, snippets, bind,
   attachments, context, lifecycle, events, transitions, accessibility), *before* writing.
2. Write the code.
3. `mcp__svelte__svelte-autofixer` on **every** file you created/modified, repeat until it reports no issues (suggestions about intentional patterns
   such as `bind:this` or calling functions in an `$effect` that talk to external systems may be ignored when justified).

## File and naming conventions

- Component `foo/Bar.tsx` → `foo/Bar.svelte` (same directory, same basename; keep `Bar.scss`). Import with the extension: `import Bar from "./Bar.svelte"`.
  Default export is the component. Re-export helpers/types from a sibling `Bar.ts` if other modules need non-component exports.
- Reactive helpers that need runes → `*.svelte.ts` (import as `./thing.svelte`). Framework-neutral logic stays `.ts`.
- React `export const Foo = ...` named component exports become default exports of `Foo.svelte`. When other (non-Svelte) code imported a named export
  from the `.tsx`, keep a thin `Foo.ts` re-exporting it so import paths stay stable.
- Once a `.svelte` replacement is complete and tested, **delete the old `.tsx`** (and its `.test.tsx` once ported). The React tree is not run anymore.
- Tests: `*.test.ts` (or `*.svelte.test.ts` when the test itself uses runes). Use `@testing-library/svelte` (`render`, `screen`, `fireEvent`) and
  `@testing-library/jest-dom` matchers (already set up). Use `createRawSnippet` for `children` snippets, or a `*.test.svelte` harness component
  for context/snippet-heavy cases. Vitest globals are on; `vi` not `jest`.

## Translation table

| React | Svelte 5 |
|---|---|
| function component + props | `let { a, b = 1, ...rest }: Props = $props()` |
| `children` / render props | `children: Snippet` / named `Snippet` props, rendered with `{@render x()}` |
| `className` | `class` (accepts clsx-style arrays/objects: `class={["a", cond && "b", { c: x }]}`; type `ClassValue` from `svelte/elements`) |
| `style={{...}}` | `style="..."` string or `style:prop={value}` directives (CSS custom props: `style:--x={v}`) |
| `onClick`, `onPointerDown` on DOM elements | `onclick`, `onpointerdown` (native events; no synthetic wrapper, no `.nativeEvent`) |
| custom callback props (`onSelect`, `onChange`) | keep the same names (they are not DOM events) |
| `useState` | `let x = $state(v)` (`$state.raw` for large objects that are only reassigned) |
| `useMemo` / derived values | `$derived` / `$derived.by` (never `$effect` to compute values) |
| `useEffect` | `$effect` only for real side effects; DOM/3rd-party setup → `{@attach fn}`; window/document listeners → `<svelte:window>` / `<svelte:document>` |
| `useLayoutEffect` | `$effect.pre` or `{@attach}`; avoid when `$derived` works |
| `useRef` for DOM | `bind:this={el}`; for mutable non-reactive values a plain `let` |
| `forwardRef` / `useImperativeHandle` | `bind:this`, an exported function via `export function ...` on the component, or a `$bindable` prop |
| `useCallback`, `memo` | not needed (drop) |
| `useContext` of editor contexts | `getEditorContext()` from `ui/editorContext.ts` (see below) |
| `createContext` (own) | `createContext` from `svelte` |
| `createPortal(x, node)` | `{@attach portal(node)}` (see `ui/portal.ts` once present) or Bits UI `Portal` |
| `flushSync` from react-dom | `flushSync` from `./editor/Editor` for editor commits; Svelte's own `flushSync` from `svelte` for DOM |
| jotai `useAtom(a)` | `const x = useAtom(a)` → read/write `x.current` (`editor-jotai.ts`); `useAtomValue`, `useSetAtom` likewise |
| jotai `atom`, `editorJotaiStore` | same names, from `editor-jotai.ts` (primitive atoms only) |
| `tunnel-rat` `Tunnel.In/Out` | `Tunnel` from `ui/Tunnel.svelte.ts`, `<TunnelIn {tunnel}>` / `<TunnelOut {tunnel} />` |
| `radix-ui` Popover / DropdownMenu / ContextMenu / Tabs | `bits-ui` (v2.20.2) — same part names (`Popover.Root/Trigger/Content/Portal/Close/Arrow`, `DropdownMenu.*`, `ContextMenu.*`, `Tabs.*`); read the Bits UI source in `node_modules/bits-ui` for the exact props |
| `clsx(...)` | Svelte `class={[...]}`; keep `clsx` only where a string is genuinely needed |
| `React.ReactNode` props that hold icons | `IconDef` (see icons) |
| `ReactDOM`/`withBatchedUpdates` | not needed in Svelte handlers; for editor code keep `batchedUpdates` from `./editor/Editor` |
| `<svg>` JSX | plain `<svg>` markup in the template |
| `t("key")` | unchanged: `import { t } from "../i18n"`. `t` is reactive inside templates/effects. `useI18n()` returns `{ t, langCode }` |
| error boundaries | `<svelte:boundary>` |

Svelte rules to respect: props are reactive (use `$derived` for values computed from props); do not mutate props; `{#each}` must be keyed with a stable id;
no `$effect` that only sets state from other state; clean up listeners/timers/observers/animation frames; no `window.confirm/alert/prompt`.
Use `ownerDocument`/`ownerWindow` of the editor (`app.ownerDocument`, `app.ownerWindow`) rather than globals in new DOM/browser API code (see `AGENTS.md`).

## Shared infrastructure that already exists

- `editor/Editor.ts` — framework-neutral replacement for `React.Component` (`setState` batching/lifecycle semantics, `flushSync`). 12 tests.
- `ui/signal.ts` — `createSignal(initial)`: reactive in Svelte, plain in imperative code.
- `editor-jotai.ts` — `atom`, `AtomStore`, `editorJotaiStore`, `useAtom/useAtomValue/useSetAtom` (reactive `current`).
- `ui/editorContext.ts` — `getEditorContext()` / `setEditorContext()` + `createEditorBridge(editor)`. The context value exposes
  `app`, `props`, reactive `appState`, reactive `elements`, `actionManager`, `editorInterface`, `api`, `container`, `setAppState`.
  Replacement map: `useApp()`→`ctx.app`, `useAppProps()`→`ctx.props`, `useExcalidrawAppState()`→`ctx.appState`, `useExcalidrawElements()`→`ctx.elements`,
  `useExcalidrawSetAppState()`→`ctx.setAppState`, `useExcalidrawActionManager()`→`ctx.actionManager`, `useEditorInterface()`→`ctx.editorInterface`,
  `useExcalidrawContainer()`→`ctx.container`, `useExcalidrawAPI()`→`ctx.api`. Read these inside `$derived`/templates, not once at init, so they stay reactive.
- `ui/Tunnel.svelte.ts`, `ui/TunnelIn.svelte`, `ui/TunnelOut.svelte` — tunnels.
- `i18n.ts` — reactive `t()`.
- `components/Button.svelte`, `components/Island.svelte` (+ tests) — style exemplars: follow them.
- Test tooling: root `vitest.config.mts` (svelte plugin, jsdom, canvas mock, `setupTests.ts`).

## Gates (run only what covers your files — do not run the whole suite)

```bash
cd /Users/billyribeiro/dev/excalidraw/excalidraw-master
pnpm exec vitest run <your test files or directory>                  # your tests
pnpm exec svelte-check --tsconfig ./tsconfig.json --output machine 2>&1 | grep -E "<your paths>"   # type/Svelte diagnostics for your files
```

`svelte-check` over the whole repo currently reports errors in not-yet-ported React files; only errors in **your** files count against you, but do not
make them worse in shared files. Unported modules that your code imports (a sibling another worker is porting) may not exist yet — import them by their
final path (`./Foo.svelte`) per this contract and note the dependency in your report.

## Report format (final message of every worker)

1. Files created / modified / deleted (paths).
2. Public API of each new component (props) when it differs from the React original, and why.
3. Exact commands run + results (tests: files/tests passed/failed/skipped; svelte-check: errors in your files).
4. Autofixer status per file.
5. INCOMPLETE / UNVERIFIED / NOT TESTED items, and any dependency on another worker's file or on shared infrastructure that is missing.
