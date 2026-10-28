<script lang="ts">
  import { actionShortcuts } from "../../../actions";
  import { t } from "../../../i18n";
  import { getEditorContext } from "../../../ui/editorContext";
  import { HelpIcon } from "../../icons";

  import MenuItem from "./MenuItem.svelte";

  const ctx = getEditorContext();
</script>

<MenuItem
  onSelect={() => ctx.actionManager.executeAction(actionShortcuts)}
  shortcut="?"
  icon={HelpIcon}
>
  {t("helpDialog.title")}
</MenuItem>
