<script lang="ts">
  import { actionShortcuts } from "../../../actions";
  import { t } from "../../../i18n";
  import { getEditorContext } from "../../../ui/editorContext";
  import DropdownMenuItem from "../../dropdownMenu/DropdownMenuItem.svelte";
  import { HelpIcon } from "../../icons";

  const ctx = getEditorContext();
</script>

<DropdownMenuItem
  data-testid="help-menu-item"
  icon={HelpIcon}
  onSelect={() => ctx.actionManager.executeAction(actionShortcuts)}
  shortcut="?"
  aria-label={t("helpDialog.title")}
>
  {t("helpDialog.title")}
</DropdownMenuItem>
