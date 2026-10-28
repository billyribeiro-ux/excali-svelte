<script lang="ts">
  import { Tabs } from "bits-ui";

  import type { Snippet } from "svelte";

  type Props = Omit<Tabs.TriggerProps, "children" | "child" | "type" | "value"> & {
    tab: string;
    children: Snippet;
  };

  let { tab, children, ...rest }: Props = $props();
</script>

<Tabs.Trigger value={tab} type="button" class="ttd-dialog-tab-trigger" {...rest}>
  {@render children()}
</Tabs.Trigger>
