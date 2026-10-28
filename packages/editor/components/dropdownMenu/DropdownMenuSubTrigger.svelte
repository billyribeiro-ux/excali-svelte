<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";

  import Icon from "../Icon.svelte";
  import { chevronRight } from "../icons";

  import { getDropdownMenuItemClassName } from "./common";
  import MenuItemContent from "./DropdownMenuItemContent.svelte";

  import type { Snippet } from "svelte";
  import type { IconDef } from "../icons";

  type Props = {
    children: Snippet;
    icon?: IconDef;
    shortcut?: string;
    class?: string;
  };

  let { children, icon, shortcut, class: className }: Props = $props();
</script>

<DropdownMenuPrimitive.SubTrigger
  class="{getDropdownMenuItemClassName(
    className,
  )} dropdown-menu__submenu-trigger"
>
  <MenuItemContent {icon} {shortcut}>
    {@render children()}
  </MenuItemContent>
  <div class="dropdown-menu__submenu-trigger-icon">
    <Icon icon={chevronRight} />
  </div>
</DropdownMenuPrimitive.SubTrigger>
