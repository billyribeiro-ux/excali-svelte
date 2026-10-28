<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";

  import {
    createDropdownMenuItemSelectHandler,
    getDropdownMenuItemClassName,
  } from "./common";
  import MenuItemContent from "./DropdownMenuItemContent.svelte";

  import type { Snippet } from "svelte";
  import type { HTMLAnchorAttributes } from "svelte/elements";
  import type { IconDef } from "../icons";

  type Props = {
    href: string;
    icon?: IconDef;
    children: Snippet;
    shortcut?: string;
    class?: string;
    selected?: boolean;
    onSelect?: (event: Event) => void;
    rel?: string;
  } & Omit<HTMLAnchorAttributes, "class" | "href" | "children" | "rel">;

  let {
    icon,
    shortcut,
    href,
    children,
    onSelect,
    class: className = "",
    selected,
    rel = "noopener",
    title,
    ...rest
  }: Props = $props();

  const handleSelect = createDropdownMenuItemSelectHandler(() => onSelect);
</script>

<DropdownMenuPrimitive.Item
  class="radix-menu-item"
  onSelect={handleSelect}
  {...rest as Record<string, unknown>}
>
  {#snippet child({ props })}
    <a
      {...props}
      {href}
      target="_blank"
      rel="noopener {rel}"
      class={[props.class, getDropdownMenuItemClassName(className, selected)]}
      title={title ?? rest["aria-label"]}
    >
      <MenuItemContent {icon} {shortcut}>
        {@render children()}
      </MenuItemContent>
    </a>
  {/snippet}
</DropdownMenuPrimitive.Item>
