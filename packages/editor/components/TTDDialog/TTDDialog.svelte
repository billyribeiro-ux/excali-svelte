<script lang="ts">
  import { getEditorContext } from "../../ui/editorContext";

  import TTDDialogBase from "./TTDDialogBase.svelte";

  import type { TTDPersistenceAdapter, TTTDDialog } from "./types";

  type Props =
    | {
        onTextSubmit: TTTDDialog.onTextSubmit;
        renderWelcomeScreen?: TTTDDialog.renderWelcomeScreen;
        renderWarning?: TTTDDialog.renderWarning;
        persistenceAdapter: TTDPersistenceAdapter;
        __fallback?: undefined;
      }
    | { __fallback: true };

  let props: Props = $props();

  const editor = getEditorContext();
  const openDialog = $derived(editor.appState.openDialog);
</script>

{#if openDialog?.name === "ttd"}
  {#if props.__fallback}
    <TTDDialogBase tab={openDialog.tab} __fallback />
  {:else}
    <TTDDialogBase
      tab={openDialog.tab}
      onTextSubmit={props.onTextSubmit}
      renderWelcomeScreen={props.renderWelcomeScreen}
      renderWarning={props.renderWarning}
      persistenceAdapter={props.persistenceAdapter}
    />
  {/if}
{/if}
