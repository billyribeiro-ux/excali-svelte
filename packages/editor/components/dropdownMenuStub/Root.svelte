<!-- test stub of dropdownMenu/DropdownMenu (bits-ui is not loadable by vitest yet) -->
<script lang="ts">
  import { setContext } from "svelte";

  import type { Snippet } from "svelte";

  let { children, open }: { children?: Snippet; open: boolean } = $props();

  setContext("dropdown-stub", {
    get open() {
      return open;
    },
  });
</script>

<div data-stub="dropdown-menu">{@render children?.()}</div>
