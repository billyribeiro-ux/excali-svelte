<script lang="ts">
  import HelpHint from "./Hints/HelpHint.svelte";
  import MenuHint from "./Hints/MenuHint.svelte";
  import ToolbarHint from "./Hints/ToolbarHint.svelte";
  import Center from "./WelcomeScreen.Center.svelte";

  import "./WelcomeScreen.scss";

  import type { Snippet } from "svelte";

  let { children }: { children?: Snippet } = $props();
</script>

{#if children}
  {@render children()}
{:else}
  <Center />
  <MenuHint />
  <ToolbarHint />
  <HelpHint />
{/if}
