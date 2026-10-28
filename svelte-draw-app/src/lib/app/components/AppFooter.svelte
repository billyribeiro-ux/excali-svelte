<script lang="ts">
  import { Footer } from "@svelte-draw/editor";

  import { isVisualDebuggerEnabled } from "./DebugCanvas.ts";
  import DebugFooter from "./DebugFooter.svelte";
  import EncryptedIcon from "./EncryptedIcon.svelte";
  import { visualDebugRevision } from "./visualDebugRevision.svelte.ts";

  let { onChange }: { onChange: () => void } = $props();

  // `window.visualDebug` is not reactive; re-evaluate whenever it is toggled
  const debuggerEnabled = $derived.by(() => {
    void visualDebugRevision.current;
    return isVisualDebuggerEnabled();
  });
</script>

<Footer>
  <div style="display: flex; gap: .5rem; align-items: center;">
    {#if debuggerEnabled}
      <DebugFooter {onChange} />
    {/if}
    <EncryptedIcon />
  </div>
</Footer>
