<script lang="ts">
  import { checkIcon, emptyIcon } from "../icons";

  import DropdownMenuItem from "./DropdownMenuItem.svelte";

  import type { ComponentProps } from "svelte";

  type Props = Omit<ComponentProps<typeof DropdownMenuItem>, "icon"> & {
    checked: boolean;
  };

  let { checked, ...rest }: Props = $props();
</script>

<DropdownMenuItem {...rest} icon={checked ? checkIcon : emptyIcon} />
