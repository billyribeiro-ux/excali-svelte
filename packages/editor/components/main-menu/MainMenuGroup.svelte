<script lang="ts">
  import DropdownMenuGroup from "../dropdownMenu/DropdownMenuGroup.svelte";

  import type { ComponentProps } from "svelte";

  // `MainMenu.Group`
  let props: ComponentProps<typeof DropdownMenuGroup> = $props();
</script>

<DropdownMenuGroup {...props} />
