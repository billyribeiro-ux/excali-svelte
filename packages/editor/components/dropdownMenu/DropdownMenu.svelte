<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";

  import { CLASSES } from "@svelte-draw/common";

  import { setDropdownMenuState } from "./common";

  import "./DropdownMenu.scss";

  import type { Snippet } from "svelte";

  let { children, open }: { children?: Snippet; open: boolean } = $props();

  // the Content reads `open` from here (React cloned the Content element)
  setDropdownMenuState({
    get open() {
      return open;
    },
  });
</script>

<!--
  The menu is controlled by the host through `open` only (like the Radix
  version, which was given `open` without `onOpenChange`): the Trigger's
  `onToggle` and the Content's `onClickOutside` / `onSelect` are what change it.
  The function binding makes Bits UI's own open/close requests a no-op.
-->
<DropdownMenuPrimitive.Root
  bind:open={() => open, () => {}}
>
  <div
    class={CLASSES.DROPDOWN_MENU_EVENT_WRAPPER}
    style="display: contents;"
  >
    {@render children?.()}
  </div>
</DropdownMenuPrimitive.Root>
