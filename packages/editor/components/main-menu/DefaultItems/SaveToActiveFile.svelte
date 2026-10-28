<script lang="ts">
  import { actionSaveToActiveFile } from "../../../actions";
  import { getShortcutFromShortcutName } from "../../../actions/shortcuts";
  import { t } from "../../../i18n";
  import { getEditorContext } from "../../../ui/editorContext";
  import DropdownMenuItem from "../../dropdownMenu/DropdownMenuItem.svelte";
  import { save } from "../../icons";

  const ctx = getEditorContext();
</script>

{#if ctx.actionManager.isActionEnabled(actionSaveToActiveFile)}
  <DropdownMenuItem
    shortcut={getShortcutFromShortcutName("saveScene")}
    data-testid="save-button"
    onSelect={() => ctx.actionManager.executeAction(actionSaveToActiveFile)}
    icon={save}
    aria-label={t("buttons.save")}
  >
    {t("buttons.save")}
  </DropdownMenuItem>
{/if}
