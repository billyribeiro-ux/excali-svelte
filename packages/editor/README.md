# Excalidraw

**Excalidraw** is exported as a React component that you can embed directly in your app.

## Installation

Install the package together with its React peer dependencies.

```bash
npm install react react-dom @svelte-draw/editor
# or
yarn add react react-dom @svelte-draw/editor
```

> **Note**: If you want to try unreleased changes, use `@svelte-draw/editor@next`.

## Quick start

The minimum working setup has two easy-to-miss requirements:

1. Import the package CSS:

```ts
import "@svelte-draw/editor/index.css";
```

2. Render Excalidraw inside a container with a non-zero height.

```tsx
import { Excalidraw } from "@svelte-draw/editor";
import "@svelte-draw/editor/index.css";

export default function App() {
  return (
    <div style={{ height: "100vh" }}>
      <Excalidraw />
    </div>
  );
}
```

Excalidraw fills `100%` of the width and height of its parent. If the parent has no height, the canvas will not be visible.

## Next.js / SSR frameworks

Excalidraw should be rendered on the client. In SSR frameworks such as Next.js, use a client component and load it dynamically with SSR disabled.

```tsx
// app/components/ExcalidrawClient.tsx
"use client";

import { Excalidraw } from "@svelte-draw/editor";
import "@svelte-draw/editor/index.css";

export default function ExcalidrawClient() {
  return (
    <div style={{ height: "100vh" }}>
      <Excalidraw />
    </div>
  );
}
```

```tsx
// app/page.tsx
import dynamic from "next/dynamic";

const ExcalidrawClient = dynamic(
  () => import("./components/ExcalidrawClient"),
  { ssr: false },
);

export default function Page() {
  return <ExcalidrawClient />;
}
```

See the local examples for complete setups:

- [examples/with-nextjs](https://github.com/excalidraw/excalidraw/tree/master/examples/with-nextjs)
- [examples/with-script-in-browser](https://github.com/excalidraw/excalidraw/tree/master/examples/with-script-in-browser)

## LLM / agent tips

If an LLM or coding agent is setting up Excalidraw, these shortcuts usually save more time than re-prompting:

- Start with a plain `<Excalidraw />` in a `100vh` container. Add refs, `initialData`, persistence, or custom UI only after the base embed works.
- If the canvas is blank, check the CSS import and parent height first. Those are the two most common integration failures.
- In Next.js or other SSR frameworks, assume client-only rendering first. Use `"use client"` and `dynamic(..., { ssr: false })` before debugging hydration or `window is not defined` errors.
- If imports or entrypoints are unclear, inspect `node_modules/@svelte-draw/editor/package.json`. The installed package exports are the source of truth.
- Do not set `window.EXCALIDRAW_ASSET_PATH` unless you are intentionally self-hosting fonts/assets.
- When docs and generated code drift, copy the nearest working example from this repo, especially `examples/with-nextjs` or `examples/with-script-in-browser`.

## Migrating to `@svelte-draw/editor@0.18.x`

Version `0.18.x` removes the old `types/`-prefixed deep import paths. If you were importing types from `@svelte-draw/editor/types/...`, switch to the new type-only subpaths below.

| Old path | New path |
| --- | --- |
| `@svelte-draw/editor/types/data/transform.js` | `@svelte-draw/editor/element/transform` |
| `@svelte-draw/editor/types/data/types.js` | `@svelte-draw/editor/data/types` |
| `@svelte-draw/editor/types/element/types.js` | `@svelte-draw/editor/element/types` |
| `@svelte-draw/editor/types/utility-types.js` | `@svelte-draw/editor/common/utility-types` |
| `@svelte-draw/editor/types/types.js` | `@svelte-draw/editor/types` |

Drop the `.js` extension. The new package `exports` map resolves these paths without it.

These deep subpaths are for `import type` only. Runtime imports should come from the package root, plus `@svelte-draw/editor/index.css` for styles.

For example:

```ts
import { exportToSvg } from "@svelte-draw/editor";
```

## Self-hosting fonts

By default, Excalidraw downloads the fonts it needs from the [CDN](https://esm.run/@svelte-draw/editor/dist/prod).

For self-hosting, copy the contents of `node_modules/@svelte-draw/editor/dist/prod/fonts` into the path where your app serves static assets, for example `public/`. Then set `window.EXCALIDRAW_ASSET_PATH` to that same path:

```html
<script>
  window.EXCALIDRAW_ASSET_PATH = "/";
</script>
```

## Demo

Try the [CodeSandbox example](https://codesandbox.io/p/sandbox/github/excalidraw/excalidraw/tree/master/examples/with-script-in-browser).

## Integration

Read the [integration docs](https://docs.excalidraw.com/docs/@svelte-draw/editor/integration).

## API

Read the [API docs](https://docs.excalidraw.com/docs/@svelte-draw/editor/api).

## Contributing

Read the [contributing docs](https://docs.excalidraw.com/docs/@svelte-draw/editor/contributing).
