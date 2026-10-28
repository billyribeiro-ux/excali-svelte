# FAQ

## Turning off aggressive block fingerprinting in Brave browser

**Symptom.** In Brave, text elements look wrong: text is mis-measured, boxes are the wrong size, or the editor shows an error panel that mentions Brave and `measureText` (that panel is `packages/editor/components/BraveMeasureTextError.svelte`).

**Cause.** The editor sizes text by measuring it with the canvas `measureText` API. Brave's *Fingerprinting blocking* feature has an **Aggressive** mode ("Aggressively Block Fingerprinting" in the Shields panel) that deliberately perturbs the results of canvas and text-measurement APIs so that sites cannot use them to identify you. With the perturbed values, text layout in a drawing becomes inconsistent.

**Fix.** Switch fingerprinting protection from *Aggressive* to the *Standard* level for the site that serves svelte-draw:

1. Open svelte-draw in Brave and click the **Shields** (lion) icon in the address bar.
2. Open **Advanced View** and find the *Block fingerprinting* setting. If it is set to *Aggressive*, change it to *Standard* (called *Block Fingerprinting* in older Brave versions) or to *Disabled*.
3. Reload the page. Existing text elements are re-measured on load and should render correctly.

The exact label and position of the setting depends on your Brave version. The same switch exists globally in `brave://settings/shields` under the fingerprinting option if you prefer to change it for every site.

If turning the setting off does not fix text rendering, please open an issue in this repository's issue tracker with your Brave version and a screenshot.

## Does svelte-draw store my drawings on a server?

No. The editor keeps your scene in the browser (local storage and IndexedDB) unless you start a live collaboration session or create a shareable link, and both of those need backend services you configure yourself. See [COLLABORATION.md](./COLLABORATION.md).

## Why are collaboration and "shareable link" not working in my deployment?

The repository does not ship the backends they depend on, and the hosted services of the upstream Excalidraw project are not used. Until you provide your own WebSocket server, Firebase project and share-link backend, those features cannot work. See [COLLABORATION.md](./COLLABORATION.md) and [DEPLOYMENT.md](./DEPLOYMENT.md).

## Why does the app need `pnpm` 12 and Node 24?

The root `package.json` pins `"packageManager": "pnpm@12.15.0"` and `"engines": { "node": ">=24.22.1" }`. Use corepack (or your toolchain manager) to get the pinned pnpm.
