<script lang="ts">
  import MenuItemContent from "./MenuItemContent.svelte";

  import type { Snippet } from "svelte";
  import type { ClassValue, HTMLButtonAttributes } from "svelte/elements";
  import type { IconDef } from "../../icons";

  type Props = {
    onSelect: () => void;
    children: Snippet;
    icon?: IconDef;
    shortcut?: string | null;
    class?: ClassValue;
  } & Omit<HTMLButtonAttributes, "class" | "children" | "type">;

  let {
    onSelect,
    children,
    icon,
    shortcut,
    class: className = "",
    ...rest
  }: Props = $props();
</script>

<button
  {...rest}
  type="button"
  class={["welcome-screen-menu-item", className]}
  onclick={onSelect}
>
  <MenuItemContent {icon} {shortcut}>
    {@render children()}
  </MenuItemContent>
</button>
