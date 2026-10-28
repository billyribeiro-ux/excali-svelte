<script lang="ts">
  import { actionClearCanvas } from "../actions";
  import { useAtom } from "../editor-jotai";
  import { t } from "../i18n";
  import { getEditorContext } from "../ui/editorContext";

  import { activeConfirmDialogAtom } from "./ActiveConfirmDialog";
  import ConfirmDialog from "./ConfirmDialog.svelte";

  const ctx = getEditorContext();
  const activeConfirmDialog = useAtom(activeConfirmDialogAtom);
</script>

{#if activeConfirmDialog.current === "clearCanvas"}
  <ConfirmDialog
    onConfirm={() => {
      ctx.actionManager.executeAction(actionClearCanvas);
      activeConfirmDialog.current = null;
    }}
    onCancel={() => (activeConfirmDialog.current = null)}
    title={t("clearCanvasDialog.title")}
  >
    <p class="clear-canvas__content">{` ${t("alerts.clearReset")}`}</p>
  </ConfirmDialog>
{/if}
