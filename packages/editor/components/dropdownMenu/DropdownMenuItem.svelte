<script lang="ts">
  import { DropdownMenu as DropdownMenuPrimitive } from "bits-ui";

  import {
    createDropdownMenuItemSelectHandler,
    getDropdownMenuItemClassName,
  } from "./common";
  import MenuItemContent from "./DropdownMenuItemContent.svelte";

  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import type { IconDef } from "../icons";

  type Props = {
    icon?: IconDef;
    badge?: Snippet;
    value?: string | number | undefined;
    onSelect?: (event: Event) => void;
    children: Snippet;
    shortcut?: string;
    selected?: boolean;
    class?: string;
  } & Omit<HTMLButtonAttributes, "class" | "value" | "children">;

  let {
    icon,
    badge,
    value,
    children,
    shortcut,
    class: className,
    selected,
    onSelect,
    disabled,
    title,
    ...rest
  }: Props = $props();

  const handleSelect = createDropdownMenuItemSelectHandler(() => onSelect);
</script>

<!--
  Bits UI merges the remaining attributes (`data-testid`, `aria-label`,
  `onclick`, ...) with its own item props and hands them to the `child`
  snippet, which is how Radix's `asChild` composed them onto the <button>.
-->
<DropdownMenuPrimitive.Item
  class="radix-menu-item"
  onSelect={handleSelect}
  disabled={disabled ?? undefined}
  {...rest as Record<string, unknown>}
>
  {#snippet child({ props })}
    <button
      {...props}
      {value}
      {disabled}
      class={[props.class, getDropdownMenuItemClassName(className, selected)]}
      title={title ?? rest["aria-label"]}
    >
      <MenuItemContent {icon} {shortcut} {badge}>
        {@render children()}
      </MenuItemContent>
    </button>
  {/snippet}
</DropdownMenuPrimitive.Item>
