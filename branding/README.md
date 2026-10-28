# Branding

Logo sources (SVG, 512x512 viewBox):

- `logo.svg` - the app logo: a rounded teal square with a hand-drawn "S" stroke and a pencil tip.
- `logo-maskable.svg` - the same mark on a full-bleed square with safe-zone padding, for maskable PWA icons.

The SVGs are the source of truth; edit them, not the generated PNGs. (Authorship/licence of the artwork is not recorded in this repository.)

## Regenerating icons

```bash
pnpm icons    # node scripts/generate-icons.mjs
```

`scripts/generate-icons.mjs` renders the SVGs with `@resvg/resvg-js` (a root dev dependency) into `svelte-draw-app/static/`:

| Output | Source | Size |
| --- | --- | --- |
| `favicon-16x16.png`, `favicon-32x32.png` | `logo.svg` | 16, 32 |
| `apple-touch-icon.png` | `logo.svg` | 180 |
| `android-chrome-192x192.png`, `android-chrome-512x512.png` | `logo.svg` | 192, 512 |
| `maskable_icon_x192.png`, `maskable_icon_x512.png` | `logo-maskable.svg` | 192, 512 |
| `favicon.svg` | copy of `logo.svg` | - |

`svelte-draw-app/static/manifest.webmanifest` references these files. Commit the regenerated outputs together with the SVG change.
