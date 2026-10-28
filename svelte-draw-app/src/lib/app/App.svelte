<script lang="ts" module>
  import polyfill from "@svelte-draw/editor/polyfill";

  polyfill();

  window.EXCALIDRAW_THROTTLE_RENDER = true;
</script>

<script lang="ts">
  import { SvelteDrawAPIProvider } from "@svelte-draw/editor";

  import ExcalidrawWrapper from "./ExcalidrawWrapper.svelte";
  import TopErrorBoundary from "./components/TopErrorBoundary.svelte";

  import "./index.scss";
  // opt-in error reporting (no-op unless VITE_APP_SENTRY_DSN is set)
  import "./sentry.ts";
</script>

<TopErrorBoundary>
  <SvelteDrawAPIProvider>
    <ExcalidrawWrapper />
  </SvelteDrawAPIProvider>
</TopErrorBoundary>
