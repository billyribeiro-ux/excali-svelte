<script lang="ts">
  import ExcalidrawLogo from "../../ExcalidrawLogo.svelte";

  import type { Snippet } from "svelte";

  let { children }: { children?: Snippet } = $props();
</script>

<div class="welcome-screen-center__logo excalifont welcome-screen-decor">
  {#if children}
    {@render children()}
  {:else}
    <ExcalidrawLogo withText />
  {/if}
</div>
