<script lang="ts">
  import { Tabs } from "bits-ui";

  import type { Snippet } from "svelte";

  type Props = Omit<Tabs.ListProps, "children" | "child"> & {
    children: Snippet;
  };

  let { children, ...rest }: Props = $props();
</script>

<Tabs.List class="ttd-dialog-triggers" {...rest}>
  {@render children()}
</Tabs.List>
