<script lang="ts">
  import { Tabs } from "bits-ui";

  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    children,
    ...rest
  }: { children: Snippet } & Omit<
    HTMLAttributes<HTMLDivElement>,
    "children" | "onselect"
  > = $props();
</script>

<Tabs.List class="sidebar-triggers" {...(rest as Record<string, any>)}>
  {@render children()}
</Tabs.List>
