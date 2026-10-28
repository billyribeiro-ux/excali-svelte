<script lang="ts">
  import Dialog from "@svelte-draw/editor/components/Dialog.svelte";
  import { getEditorContext } from "@svelte-draw/editor/ui/editorContext";

  import {
    activeRoomLinkAtom,
    useAtom,
    useAtomValue,
  } from "#lib/app/app-atoms.ts";

  import "./ShareDialog.scss";
  import { shareDialogStateAtom } from "./ShareDialog.ts";
  import ShareDialogActiveRoom from "./ShareDialogActiveRoom.svelte";
  import ShareDialogPicker from "./ShareDialogPicker.svelte";

  import type { CollabAPI } from "#lib/app/collab/Collab.ts";
  import type { OnExportToBackend } from "./ShareDialog.ts";

  let {
    collabAPI,
    onExportToBackend,
  }: {
    collabAPI: CollabAPI | null;
    onExportToBackend: OnExportToBackend;
  } = $props();

  const shareDialogState = useAtom(shareDialogStateAtom);
  const state = $derived(shareDialogState.current);
  const activeRoomLink = useAtomValue(activeRoomLinkAtom);

  // replaces `useUIAppState().openDialog`
  const ctx = getEditorContext();
  const openDialog = $derived(ctx.appState.openDialog);

  const handleClose = () => {
    shareDialogState.current = { isOpen: false };
  };

  $effect(() => {
    if (openDialog) {
      shareDialogState.current = { isOpen: false };
    }
  });
</script>

{#if state.isOpen}
  <Dialog size="small" onCloseRequest={handleClose} title={false}>
    <div class="ShareDialog">
      {#if collabAPI && activeRoomLink.current}
        <ShareDialogActiveRoom
          {collabAPI}
          activeRoomLink={activeRoomLink.current}
          {handleClose}
        />
      {:else}
        <ShareDialogPicker
          {collabAPI}
          {onExportToBackend}
          {handleClose}
          type={state.type}
        />
      {/if}
    </div>
  </Dialog>
{/if}
