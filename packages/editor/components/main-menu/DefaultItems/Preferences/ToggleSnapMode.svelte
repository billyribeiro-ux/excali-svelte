<script lang="ts">
  import { actionToggleObjectsSnapMode } from "../../../../actions";
  import { getShortcutFromShortcutName } from "../../../../actions/shortcuts";
  import { t } from "../../../../i18n";
  import { getEditorContext } from "../../../../ui/editorContext";
  import DropdownMenuItemCheckbox from "../../../dropdownMenu/DropdownMenuItemCheckbox.svelte";

  const ctx = getEditorContext();
</script>

<DropdownMenuItemCheckbox
  checked={ctx.appState.objectsSnapModeEnabled}
  shortcut={getShortcutFromShortcutName("objectsSnapMode")}
  onSelect={(event) => {
    ctx.actionManager.executeAction(actionToggleObjectsSnapMode);
    event.preventDefault();
  }}
>
  {t("buttons.objectsSnapMode")}
</DropdownMenuItemCheckbox>
