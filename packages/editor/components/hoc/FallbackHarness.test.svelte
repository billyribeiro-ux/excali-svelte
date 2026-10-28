<script lang="ts">
  import { createTunnels, setTunnels } from "../../context/tunnels";
  import { setEditorContext } from "../../ui/editorContext";
  import TunnelOut from "../../ui/TunnelOut.svelte";
  import MainMenu from "../main-menu/MainMenu.svelte";

  import type { EditorContextValue } from "../../ui/editorContext";

  let {
    ctx,
    host,
    hostAfterFallback = false,
  }: {
    ctx: EditorContextValue;
    /** render a host-declared `<MainMenu>` */
    host: boolean;
    /** render the host after the fallback (not like `LayerUI`, which renders
     * host children first) */
    hostAfterFallback?: boolean;
  } = $props();

  const tunnels = createTunnels();
  setTunnels(tunnels);
  // svelte-ignore state_referenced_locally
  setEditorContext(ctx);
</script>

<!-- mimics `LayerUI`: host-declared components, the fallback, and the outlet -->
<div class="excalidraw-container">
  {#if host && !hostAfterFallback}
    <MainMenu>test</MainMenu>
  {/if}
  <MainMenu __fallback />
  {#if host && hostAfterFallback}
    <MainMenu>test</MainMenu>
  {/if}
  <TunnelOut tunnel={tunnels.MainMenuTunnel} />
</div>
