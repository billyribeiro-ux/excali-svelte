<script lang="ts">
  import { createTunnel } from "./Tunnel.svelte";
  import TunnelIn from "./TunnelIn.svelte";
  import TunnelOut from "./TunnelOut.svelte";

  let { showIn }: { showIn: boolean } = $props();

  const tunnel = createTunnel();
</script>

<div data-testid="in">
  {#if showIn}
    <TunnelIn {tunnel}>
      <span class="tunneled">hello</span>
    </TunnelIn>
  {/if}
</div>
<div data-testid="out">
  <TunnelOut {tunnel} />
</div>
