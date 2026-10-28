<script lang="ts">
  import { actionToggleGridMode } from "../../../../actions";
  import { getShortcutFromShortcutName } from "../../../../actions/shortcuts";
  import { t } from "../../../../i18n";
  import { getEditorContext } from "../../../../ui/editorContext";
  import DropdownMenuItemCheckbox from "../../../dropdownMenu/DropdownMenuItemCheckbox.svelte";

  const ctx = getEditorContext();
</script>

<DropdownMenuItemCheckbox
  checked={ctx.appState.gridModeEnabled}
  shortcut={getShortcutFromShortcutName("gridMode")}
  onSelect={(event) => {
    ctx.actionManager.executeAction(actionToggleGridMode);
    event.preventDefault();
  }}
>
  {t("labels.toggleGrid")}
</DropdownMenuItemCheckbox>
