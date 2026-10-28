<script lang="ts">
  import MenuItemContent from "./MenuItemContent.svelte";

  import type { Snippet } from "svelte";
  import type { ClassValue, HTMLAnchorAttributes } from "svelte/elements";
  import type { IconDef } from "../../icons";

  type Props = {
    children: Snippet;
    href: string;
    icon?: IconDef;
    shortcut?: string | null;
    class?: ClassValue;
  } & Omit<HTMLAnchorAttributes, "class" | "children" | "href">;

  let {
    children,
    href,
    icon,
    shortcut,
    class: className = "",
    ...rest
  }: Props = $props();
</script>

<a
  {...rest}
  class={["welcome-screen-menu-item", className]}
  {href}
  target="_blank"
  rel="noopener"
>
  <MenuItemContent {icon} {shortcut}>
    {@render children()}
  </MenuItemContent>
</a>
