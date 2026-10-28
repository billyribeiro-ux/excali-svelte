<script lang="ts">
  import { actionClearCanvas } from "../../../actions";
  import { useSetAtom } from "../../../editor-jotai";
  import { t } from "../../../i18n";
  import { getEditorContext } from "../../../ui/editorContext";
  import { activeConfirmDialogAtom } from "../../ActiveConfirmDialog";
  import DropdownMenuItem from "../../dropdownMenu/DropdownMenuItem.svelte";
  import { TrashIcon } from "../../icons";

  const ctx = getEditorContext();
  const setActiveConfirmDialog = useSetAtom(activeConfirmDialogAtom);
</script>

{#if ctx.actionManager.isActionEnabled(actionClearCanvas)}
  <DropdownMenuItem
    icon={TrashIcon}
    onSelect={() => setActiveConfirmDialog("clearCanvas")}
    data-testid="clear-canvas-button"
    aria-label={t("buttons.clearReset")}
  >
    {t("buttons.clearReset")}
  </DropdownMenuItem>
{/if}
