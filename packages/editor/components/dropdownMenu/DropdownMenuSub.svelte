<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";

  import type { Snippet } from "svelte";

  let { children }: { children?: Snippet } = $props();
</script>

<DropdownMenuPrimitive.Sub>
  {@render children?.()}
</DropdownMenuPrimitive.Sub>
