# @svelte-draw/editor

The svelte-draw editor: a Svelte 5 component (`SvelteDraw`) built on the framework-neutral drawing core of [Excalidraw](https://github.com/excalidraw/excalidraw) (MIT). This is a workspace package of this repository and is consumed from source by `svelte-draw-app`; it is not published to npm.

## Usage

```svelte
<script lang="ts">
  import { SvelteDraw } from "@svelte-draw/editor";
</script>

<div style="height: 100vh">
  <SvelteDraw initialData={{ appState: { viewBackgroundColor: "#ffffff" } }} />
</div>
```

`SvelteDraw` imports its own styles and fonts. It fills `100%` of the width and height of its parent, so the parent needs a height or the canvas is not visible.

The editor must render on the client. In SvelteKit, load it from a client-only code path (the app does this with a dynamic `import()` in `svelte-draw-app/src/routes/+page.svelte`).

## Customizing the UI

Slots that were render props in the React version are Svelte snippets: `renderTopRightUI`, `renderTopLeftUI`, `renderCustomStats` and so on. Menus, the welcome screen, sidebars and footers are composed from child components (`MainMenu`, `WelcomeScreen`, `Sidebar`, `Footer`, ...), exported from `@svelte-draw/editor`. See `svelte-draw-app/src/lib/app/ExcalidrawWrapper.svelte` for a complete example.

## Fonts

Fonts are bundled and served from the same origin. Set `window.EXCALIDRAW_ASSET_PATH` only to self-host them elsewhere.

## Data format

Scenes use the unchanged `.excalidraw` JSON format and MIME type, so files remain interchangeable with Excalidraw.

## More

- Architecture: [`docs/ARCHITECTURE.md`](../../docs/ARCHITECTURE.md)
- Porting rules: [`docs/SVELTE_PORT_GUIDE.md`](../../docs/SVELTE_PORT_GUIDE.md)
