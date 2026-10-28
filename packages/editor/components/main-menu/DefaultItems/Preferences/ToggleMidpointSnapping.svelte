<script lang="ts">
  import { actionToggleMidpointSnapping } from "../../../../actions";
  import { t } from "../../../../i18n";
  import { getEditorContext } from "../../../../ui/editorContext";
  import DropdownMenuItemCheckbox from "../../../dropdownMenu/DropdownMenuItemCheckbox.svelte";

  const ctx = getEditorContext();
</script>

<DropdownMenuItemCheckbox
  checked={ctx.appState.isMidpointSnappingEnabled}
  onSelect={(event) => {
    ctx.actionManager.executeAction(actionToggleMidpointSnapping);
    event.preventDefault();
  }}
>
  {t("labels.midpointSnapping")}
</DropdownMenuItemCheckbox>
