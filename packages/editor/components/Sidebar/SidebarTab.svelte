<script lang="ts">
  import { Tabs } from "bits-ui";

  import { getEditorContext } from "../../ui/editorContext";

  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";
  import type { SidebarTabName } from "../../types";

  let {
    tab,
    children,
    ...rest
  }: {
    tab: SidebarTabName;
    children: Snippet;
  } & Omit<HTMLAttributes<HTMLDivElement>, "children"> = $props();

  const ctx = getEditorContext();

  // like Radix, only the active tab's content is mounted (Bits UI would keep
  // inactive panels mounted but hidden)
  const isActive = $derived(ctx.appState.openSidebar?.tab === tab);
</script>

{#if isActive}
  <Tabs.Content {...(rest as Record<string, any>)} value={tab} data-testid={tab}>
    {@render children()}
  </Tabs.Content>
{/if}
