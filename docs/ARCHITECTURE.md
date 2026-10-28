# Architecture

svelte-draw is a pnpm-workspaces monorepo (`pnpm-workspace.yaml`: `svelte-draw-app`, `packages/*`). The editor
was ported from a React code base to Svelte 5; the editor *core* stayed a plain TypeScript class and
only the view layer is Svelte. Porting rules live in [SVELTE_PORT_GUIDE.md](./SVELTE_PORT_GUIDE.md);
what was ported from what is tracked in [MIGRATION_INVENTORY.md](./MIGRATION_INVENTORY.md).

```
svelte-draw-app (SvelteKit, adapter-static)
        |  uses
        v
@svelte-draw/editor  ----->  @svelte-draw/{common, element, math, laser-pointer}
(SvelteDraw component)       (framework-neutral; utils and fractional-indexing are
                              also separate packages)
```

## Packages

| Package | Path | Notes |
| --- | --- | --- |
| `@svelte-draw/common` | `packages/common` | constants, helpers, utility types (`utility-types`) |
| `@svelte-draw/math` | `packages/math` | points, vectors, curves |
| `@svelte-draw/element` | `packages/element` | element model, bindings, rendering of single elements |
| `@svelte-draw/utils` | `packages/utils` | export helpers |
| `@svelte-draw/fractional-indexing` | `packages/fractional-indexing` | z-order indices |
| `@svelte-draw/laser-pointer` | `packages/laser-pointer` | laser trail geometry |
| `@svelte-draw/editor` | `packages/editor` | the `SvelteDraw` Svelte 5 component and everything UI |

The app resolves the workspace packages from source (see the alias list in `svelte-draw-app/vite.config.ts`);
packages are not built to `dist/` for local development.

## Editor core (`packages/editor/components/App.ts`)

`class App extends Editor<AppProps, AppState>` (about 11k lines) is the editor core: tools,
pointer/keyboard handling, scene, history, actions. It is a **plain TypeScript class**, not a
component. Large concerns are split into sibling modules named `App.*.ts` in the same directory
(`App.viewport.ts`, `App.clipboard.ts`, `App.text.ts`, `App.host.ts`, ...), which `App.ts` imports.

## Editor base class (`packages/editor/editor/Editor.ts`)

A framework-neutral reimplementation of the parts of React's class-component contract that the core
relies on (documented in the file header, and tested in `editor/Editor.test.ts`):

- `setState` is batched: it never mutates `this.state` synchronously; queued updates are committed
  together by `flushSync` (microtask when issued from a discrete DOM event, later task otherwise).
  `batchedUpdates` and `flushSync` are exported from the same file.
- Lifecycle: `componentDidMount`, `getSnapshotBeforeUpdate`, `componentDidUpdate`, `forceUpdate`.
- The view registers through `subscribeCommit()` (runs where a DOM commit would happen, before
  `componentDidUpdate`) and `subscribePostCommit()` (runs after `componentDidUpdate` and the `setState`
  callbacks; used to trigger canvas painting).

## View (Svelte)

- `components/SvelteDraw.svelte` is the public component. It loads the language
  (`setLanguage`) and then renders `EditorHost`.
- `components/EditorHost.svelte` constructs the `App` instance once, builds an editor bridge
  (`ui/editorContext.ts`), publishes it with `setEditorContext`, and subscribes to commits: on each
  commit it refreshes the signals, recomputes the **render model** and flushes Svelte synchronously
  (`flushViewSync`, which is skipped while Svelte itself is running effects). Prop changes reach
  the core through `app.setProps`. It renders `EditorView`.
- `components/EditorView.svelte` renders the editor container, `LayerUI` (toolbars, menus, dialogs),
  the overlays, and the three canvases.
- `ui/signal.ts` (`createSignal`): reactive in Svelte (via `createSubscriber`), plain in imperative code;
  `ui/editorContext.ts` exposes `app`, `props`, `appState`, `elements`, `actionManager`, ... to child components.
- `ui/Tunnel.svelte.ts`, `TunnelIn.svelte`, `TunnelOut.svelte`: content declared in one place and rendered in another.
- `editor-jotai.ts`: a small atom store (`atom`, `AtomStore`, `editorJotaiStore`, `useAtom`, `useAtomValue`, `useSetAtom`); it
  is not the `jotai` library.

## Render model (`components/renderModel.ts`)

`RenderModel` is the data the view needs for one commit (selected elements, renderable elements map,
visible elements, static-canvas render config, frame/embeddable render data, ...). It is computed
once per commit by `App.computeRenderModel()`, in the position where React's `render()` used to run,
so render-time side effects the core depends on keep their order.

## Canvases (`components/canvases/`)

`StaticCanvas.svelte` (elements), `NewElementCanvas.svelte` (element being drawn) and
`InteractiveCanvas.svelte` (selection, handles, collaborator cursors). They paint from the render model after
each commit's `paintEpoch` changes, i.e. after `componentDidUpdate`, mirroring React's `useEffect` ordering.
Drawing code lives in `packages/editor/renderer/` and `packages/element`.

## Application layer (`svelte-draw-app/src/lib/app`)

The host app wires the editor to storage and the network: `App.svelte`, the wrapper component, `collab/`,
`data/` (local storage, IndexedDB, Firebase, share links), `share/` (share dialog) and app-level components.
Routes are in `svelte-draw-app/src/routes`; `+layout.ts` sets `prerender = true`. See
[COLLABORATION.md](./COLLABORATION.md).

## Test harness

- Root `vitest.config.mts`: Svelte plugin, `@testing-library/svelte`'s `svelteTesting`, `jsdom`, globals on,
  hooks run in parallel, setup file `setupTests.ts` (canvas mock, jest-dom matchers, cleanup after each test, a DOM
  snapshot serializer that strips Svelte's anchor comments).
- Editor tests live in `packages/editor/tests/` with helpers in `packages/editor/tests/helpers/`; component tests sit next
  to their component. Tests that need runes or snippets use `*.test.svelte` harness components.
- App tests: `svelte-draw-app/src/lib/app/tests/`.
