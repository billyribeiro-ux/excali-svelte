<script lang="ts">
  import { useInternalFallback } from "../hoc/withInternalFallback.svelte";

  import TTDDialogContent from "./TTDDialogContent.svelte";

  import type { TTDPersistenceAdapter, TTTDDialog } from "./types";

  type Props = {
    tab: "text-to-diagram" | "mermaid";
  } & (
    | {
        onTextSubmit: TTTDDialog.onTextSubmit;
        renderWelcomeScreen?: TTTDDialog.renderWelcomeScreen;
        renderWarning?: TTTDDialog.renderWarning;
        persistenceAdapter: TTDPersistenceAdapter;
        __fallback?: undefined;
      }
    | { __fallback: true }
  );

  /**
   * Text to diagram (TTD) dialog. Renders the dialog content unless this is
   * the editor's fallback instance and the host rendered its own `<TTDDialog>`.
   */
  let props: Props = $props();

  const fallback = useInternalFallback("TTDDialogBase", () => props.__fallback);
</script>

{#if fallback.shouldRender}
  {#if props.__fallback}
    <TTDDialogContent tab={props.tab} __fallback />
  {:else}
    <TTDDialogContent
      tab={props.tab}
      onTextSubmit={props.onTextSubmit}
      renderWelcomeScreen={props.renderWelcomeScreen}
      renderWarning={props.renderWarning}
      persistenceAdapter={props.persistenceAdapter}
    />
  {/if}
{/if}
