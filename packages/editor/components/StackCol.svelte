<script lang="ts">
  import Stack from "./Stack.svelte";

  import type { ComponentProps } from "svelte";

  type Props = Omit<ComponentProps<typeof Stack>, "direction">;

  let { element = $bindable(null), ...props }: Props = $props();
</script>

<Stack {...props} direction="vertical" bind:element />
