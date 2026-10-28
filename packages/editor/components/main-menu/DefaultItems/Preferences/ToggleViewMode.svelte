<script lang="ts">
  import { actionToggleViewMode } from "../../../../actions/actionToggleViewMode";
  import { getShortcutFromShortcutName } from "../../../../actions/shortcuts";
  import { t } from "../../../../i18n";
  import { getEditorContext } from "../../../../ui/editorContext";
  import DropdownMenuItemCheckbox from "../../../dropdownMenu/DropdownMenuItemCheckbox.svelte";

  const ctx = getEditorContext();
</script>

{#if ctx.actionManager.isActionEnabled(actionToggleViewMode)}
  <DropdownMenuItemCheckbox
    checked={ctx.appState.viewModeEnabled}
    shortcut={getShortcutFromShortcutName("viewMode")}
    onSelect={(event) => {
      ctx.actionManager.executeAction(actionToggleViewMode);
      event.preventDefault();
    }}
  >
    {t("labels.viewMode")}
  </DropdownMenuItemCheckbox>
{/if}
