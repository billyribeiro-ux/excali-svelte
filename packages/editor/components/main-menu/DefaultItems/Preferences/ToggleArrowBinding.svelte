<script lang="ts">
  import { actionToggleArrowBinding } from "../../../../actions";
  import { t } from "../../../../i18n";
  import { getEditorContext } from "../../../../ui/editorContext";
  import DropdownMenuItemCheckbox from "../../../dropdownMenu/DropdownMenuItemCheckbox.svelte";

  const ctx = getEditorContext();
</script>

<DropdownMenuItemCheckbox
  checked={ctx.appState.bindingPreference === "enabled"}
  onSelect={(event) => {
    ctx.actionManager.executeAction(actionToggleArrowBinding);
    event.preventDefault();
  }}
>
  {t("labels.arrowBinding")}
</DropdownMenuItemCheckbox>
