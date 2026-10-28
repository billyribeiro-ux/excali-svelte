<script lang="ts">
  import type { Snippet } from "svelte";
  import type { ClassValue } from "svelte/elements";

  type Props = {
    children: Snippet;
    class?: ClassValue;
    style?: string;
    title?: string;
  };

  let { children, class: className = "", style, title }: Props = $props();
</script>

<div class={["dropdown-menu-group", className]} {style}>
  {#if title}<p class="dropdown-menu-group-title">{title}</p>{/if}
  {@render children()}
</div>
