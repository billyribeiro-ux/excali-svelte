<script lang="ts">
  import { actionSaveFileToDisk } from "../../../actions";
  import { t } from "../../../i18n";
  import { getEditorContext } from "../../../ui/editorContext";

  import Action from "./Action.svelte";

  const ctx = getEditorContext();
</script>

<Action
  title={t("overwriteConfirm.action.saveToDisk.title")}
  actionLabel={t("overwriteConfirm.action.saveToDisk.button")}
  onClick={() => {
    ctx.actionManager.executeAction(actionSaveFileToDisk, "ui");
  }}
>
  {t("overwriteConfirm.action.saveToDisk.description")}
</Action>
