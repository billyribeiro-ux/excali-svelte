# Contributing

## Setup

Requirements: Node >= 26.13.0 and pnpm 12.15.0 (both pinned in the root `package.json`; use corepack or your toolchain manager). Do not use npm or yarn.

```bash
pnpm install
pnpm dev        # SvelteKit dev server for svelte-draw-app
```

## Commands (root `package.json`)

| Command | What it does |
| --- | --- |
| `pnpm dev` / `pnpm build` / `pnpm preview` | dev server, static build to `svelte-draw-app/build`, preview |
| `pnpm check` | `svelte-kit sync` + `svelte-check` for `svelte-draw-app` |
| `pnpm test` | `vitest run` (whole suite) |
| `pnpm test:watch`, `pnpm test:coverage` | watch mode, coverage |
| `pnpm icons` | regenerate favicons/PWA icons from `branding/*.svg` (see `branding/README.md`) |
| `pnpm locales-coverage` | rewrite `packages/editor/locales/percentages.json` |

`pnpm lint`, `pnpm format` and `pnpm format:check` are declared in `package.json`, but their configuration is **planned and not in place yet**; do not rely on them until it lands.

## Test what you changed

The full suite is large. While working, run only what your change touches:

```bash
pnpm exec vitest run packages/editor/editor/Editor.test.ts                 # one file
pnpm exec vitest run packages/editor/components/Button.test.ts -t "name"   # one test
pnpm exec vitest run packages/editor/tests/                                # a directory
pnpm exec svelte-check --tsconfig ./tsconfig.json --output machine 2>&1 | grep "<your path>"
pnpm check                                                                  # app typecheck
```

Run the full `pnpm test` and `pnpm build` once before you push. Never update snapshots to hide a difference; find out why it differs.

## Conventions

Read [docs/SVELTE_PORT_GUIDE.md](docs/SVELTE_PORT_GUIDE.md) before touching UI code, and [AGENTS.md](AGENTS.md) for the short rule list (use the editor's `ownerDocument`/`ownerWindow` instead of globals; prefer `Merge<>` for overriding types). Svelte files are `.svelte` / `.svelte.ts`, tests are `*.test.ts` using `@testing-library/svelte` and `vi` (not `jest`).

## Dependencies and licensing

Dependencies are pinned exactly (`save-exact=true` in `.npmrc`). New bundled fonts or assets must be recorded in `THIRD_PARTY_NOTICES.md` with their license. The project is MIT licensed (`LICENSE`); see `NOTICE.md` for origin.
