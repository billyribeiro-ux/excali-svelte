<script lang="ts">
  import { createTunnels, setTunnels } from "../../context/tunnels";
  import { setEditorContext } from "../../ui/editorContext";
  import TunnelOut from "../../ui/TunnelOut.svelte";

  import OverwriteConfirmDialog from "./OverwriteConfirm.svelte";
  import { ExportToImage, SaveToDisk } from "./OverwriteConfirmActions";

  import type { EditorContextValue } from "../../ui/editorContext";

  let {
    ctx,
    host = false,
  }: { ctx: EditorContextValue; host?: boolean } = $props();

  const tunnels = createTunnels();
  setTunnels(tunnels);
  // svelte-ignore state_referenced_locally
  setEditorContext(ctx);
</script>

<div class="excalidraw-container">
  {#if host}
    <OverwriteConfirmDialog>
      <div id="host-action">host action</div>
    </OverwriteConfirmDialog>
  {/if}
  <OverwriteConfirmDialog __fallback>
    <SaveToDisk />
    <ExportToImage />
  </OverwriteConfirmDialog>
  <TunnelOut tunnel={tunnels.OverwriteConfirmDialogTunnel} />
</div>
