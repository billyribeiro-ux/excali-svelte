<script lang="ts">
  import { getTunnels } from "../context/tunnels";
  import TunnelIn from "../ui/TunnelIn.svelte";

  import type { Snippet } from "svelte";

  let { children }: { children: Snippet } = $props();

  const tunnels = getTunnels();
</script>

<TunnelIn tunnel={tunnels.DefaultSidebarTabTriggersTunnel}>
  {@render children()}
</TunnelIn>
