<script lang="ts">
  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();
</script>

<div class="welcome-screen-center__heading welcome-screen-decor excalifont">
  {@render children()}
</div>
