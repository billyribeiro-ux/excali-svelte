<script lang="ts">
  import { actionToggleZenMode } from "../../../../actions";
  import { getShortcutFromShortcutName } from "../../../../actions/shortcuts";
  import { t } from "../../../../i18n";
  import { getEditorContext } from "../../../../ui/editorContext";
  import DropdownMenuItemCheckbox from "../../../dropdownMenu/DropdownMenuItemCheckbox.svelte";

  const ctx = getEditorContext();
</script>

<DropdownMenuItemCheckbox
  checked={ctx.appState.zenModeEnabled}
  shortcut={getShortcutFromShortcutName("zenMode")}
  onSelect={(event) => {
    ctx.actionManager.executeAction(actionToggleZenMode);
    event.preventDefault();
  }}
>
  {t("buttons.zenMode")}
</DropdownMenuItemCheckbox>
