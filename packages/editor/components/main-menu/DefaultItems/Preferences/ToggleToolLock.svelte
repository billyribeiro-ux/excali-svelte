<script lang="ts">
  import { getShortcutFromShortcutName } from "../../../../actions/shortcuts";
  import { t } from "../../../../i18n";
  import { getEditorContext } from "../../../../ui/editorContext";
  import DropdownMenuItemCheckbox from "../../../dropdownMenu/DropdownMenuItemCheckbox.svelte";

  const ctx = getEditorContext();
</script>

<DropdownMenuItemCheckbox
  checked={ctx.appState.activeTool.locked}
  shortcut={getShortcutFromShortcutName("toolLock")}
  onSelect={(event) => {
    ctx.app.toggleLock();
    event.preventDefault();
  }}
>
  {t("labels.preferences_toolLock")}
</DropdownMenuItemCheckbox>
