<script lang="ts">
  import LibraryMenuBrowseButton from "./LibraryMenuBrowseButton.svelte";

  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";
  import type { SvelteDrawProps, UIAppState } from "../types";

  type Props = {
    libraryReturnUrl: SvelteDrawProps["libraryReturnUrl"];
    theme: UIAppState["theme"];
    id: string;
    /** inline CSS string (React took a CSSProperties object) */
    style: string;
    children?: Snippet;
    class?: ClassValue;
  };

  let {
    libraryReturnUrl,
    theme,
    id,
    style,
    children,
    class: className,
  }: Props = $props();
</script>

<div class={["library-menu-control-buttons", className]} {style}>
  <LibraryMenuBrowseButton {id} {libraryReturnUrl} {theme} />
  {@render children?.()}
</div>
