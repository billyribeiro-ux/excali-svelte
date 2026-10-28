# svelte-draw

A hand-drawn style virtual whiteboard built with **Svelte 5** and **SvelteKit**. svelte-draw is a Svelte port and independent derivative of the MIT-licensed Excalidraw project; see [NOTICE.md](NOTICE.md) for origin and credit. It is not affiliated with or endorsed by Excalidraw.

## What is in this repository

- A static SvelteKit app (`svelte-draw-app`, built with `@sveltejs/adapter-static`) that hosts the editor.
- The editor as a Svelte 5 component library (`packages/editor`, `@svelte-draw/editor`, public component `SvelteDraw`) and its framework-neutral support packages (`@svelte-draw/{common,element,math,utils,fractional-indexing,laser-pointer}`).
- Client code for optional live collaboration and shareable links. **The backends for those features are not included**, and Excalidraw's hosted services are not used. See [docs/COLLABORATION.md](docs/COLLABORATION.md).

Features present in the source: hand-drawn shapes, arrows, text, freedraw, images, frames and embeddables; selection and snapping; undo/redo history; element library; command palette; export (image/SVG/clipboard) and JSON save/load; light/dark themes; 57 locales including English (`packages/editor/locales`, per `percentages.json`); Mermaid and chart import; collaboration client with end-to-end encryption (needs your own backend). Which of these are polished or complete is tracked in [docs/MIGRATION_INVENTORY.md](docs/MIGRATION_INVENTORY.md).

## Quick start

Requirements: Node >= 26.13.0 and pnpm 12.15.0 (pinned in `package.json`; corepack can provision it).

```bash
pnpm install
pnpm dev          # dev server
pnpm build        # static site -> svelte-draw-app/build
pnpm preview      # serve the production build locally
pnpm check        # svelte-kit sync + svelte-check (svelte-draw-app)
pnpm test         # vitest run (full suite)
```

Other scripts: `pnpm test:watch`, `pnpm test:coverage`, `pnpm icons` (regenerate icons, see [branding/README.md](branding/README.md)), `pnpm locales-coverage`. `pnpm lint`, `pnpm format` and `pnpm format:check` are planned; their configuration has not landed yet. Targeted-test guidance is in [CONTRIBUTING.md](CONTRIBUTING.md).

## Repository layout

```
svelte-draw-app/       SvelteKit app (src/lib/app = app code, src/routes, static/)
packages/editor/       @svelte-draw/editor (SvelteDraw component, actions, renderer, locales, fonts)
packages/{common,element,math,utils,fractional-indexing,laser-pointer}/
branding/              logo sources
docs/                  architecture, deployment, collaboration, port guide, FAQ
infra/                 nginx.conf, Firebase rules (firestore/storage)
scripts/               icon generation, locale coverage
```

## Architecture in brief

The editor core is a plain TypeScript class (`packages/editor/components/App.ts`) built on a small framework-neutral base class (`packages/editor/editor/Editor.ts`) that provides batched `setState`, `flushSync` and lifecycle semantics. The Svelte view (`EditorHost.svelte`, `EditorView.svelte`, `components/canvases/*.svelte`) subscribes to editor commits and renders from a per-commit `RenderModel` (`components/renderModel.ts`). Details: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Configuration

Build-time options are Vite environment variables (`VITE_APP_*`). The ones the source reads are listed, with what happens when they are unset, in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Deployment

Files provided in this repo: `Dockerfile` (+ `docker-compose.yml`, `infra/nginx.conf`) and `vercel.json`. See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

## Documentation

[Architecture](docs/ARCHITECTURE.md) | [Deployment](docs/DEPLOYMENT.md) | [Collaboration](docs/COLLABORATION.md) | [FAQ](docs/faq.md) | [Port guide](docs/SVELTE_PORT_GUIDE.md) | [Contributing](CONTRIBUTING.md)

## License

MIT, see [LICENSE](LICENSE). Origin: [NOTICE.md](NOTICE.md). Fonts and bundled assets: [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
