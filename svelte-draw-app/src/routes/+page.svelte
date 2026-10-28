<script lang="ts">
  import { onMount } from "svelte";
  import type { Component } from "svelte";

  import { PRODUCT_NAME } from "#lib/index.ts";

  // The editor needs `window`, `document` and canvas APIs at import time, so
  // it is loaded on the client only; the prerendered page is the HTML shell.
  let App: Component | null = $state(null);

  onMount(async () => {
    App = (await import("#lib/app/App.svelte")).default;
  });
</script>

<svelte:head>
  <title>{PRODUCT_NAME}</title>
</svelte:head>

{#if App}
  <App />
{/if}
