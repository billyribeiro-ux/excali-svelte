<script lang="ts">
  import { Tabs } from "bits-ui";

  import type { Snippet } from "svelte";

  type Props = Omit<Tabs.ContentProps, "value" | "children" | "child"> & {
    tab: string;
    children: Snippet;
  };

  let { tab, children, ...rest }: Props = $props();
</script>

<Tabs.Content {...rest} value={tab}>
  {@render children()}
</Tabs.Content>
