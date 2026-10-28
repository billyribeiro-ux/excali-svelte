<script lang="ts">
  import { actionToggleStats } from "../../../../actions";
  import { getShortcutFromShortcutName } from "../../../../actions/shortcuts";
  import { t } from "../../../../i18n";
  import { getEditorContext } from "../../../../ui/editorContext";
  import DropdownMenuItemCheckbox from "../../../dropdownMenu/DropdownMenuItemCheckbox.svelte";

  const ctx = getEditorContext();
</script>

<DropdownMenuItemCheckbox
  checked={ctx.appState.stats.open}
  shortcut={getShortcutFromShortcutName("stats")}
  onSelect={(event) => {
    ctx.actionManager.executeAction(actionToggleStats);
    event.preventDefault();
  }}
>
  {t("stats.fullTitle")}
</DropdownMenuItemCheckbox>
