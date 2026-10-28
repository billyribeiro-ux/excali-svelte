<script lang="ts">
  import { actionToggleShowHints } from "../../../../actions";
  import { t } from "../../../../i18n";
  import { getEditorContext } from "../../../../ui/editorContext";
  import DropdownMenuItemCheckbox from "../../../dropdownMenu/DropdownMenuItemCheckbox.svelte";

  const ctx = getEditorContext();
</script>

<DropdownMenuItemCheckbox
  checked={ctx.appState.showHints}
  onSelect={(event) => {
    ctx.actionManager.executeAction(actionToggleShowHints);
    event.preventDefault();
  }}
>
  {t("labels.showHints")}
</DropdownMenuItemCheckbox>
