<script lang="ts">
  import { Tabs } from "bits-ui";

  import type { Snippet } from "svelte";
  import type { HTMLButtonAttributes } from "svelte/elements";
  import type { SidebarTabName } from "../../types";

  let {
    children,
    tab,
    ...rest
  }: {
    children: Snippet;
    tab: SidebarTabName;
  } & Omit<HTMLButtonAttributes, "children"> = $props();
</script>

<Tabs.Trigger
  value={tab}
  type="button"
  class="excalidraw-button sidebar-tab-trigger"
  {...(rest as Record<string, any>)}
>
  {@render children()}
</Tabs.Trigger>
