<script lang="ts">
  import { actionChangeExportEmbedScene } from "../../../actions/actionExport";
  import { t } from "../../../i18n";
  import { getEditorContext } from "../../../ui/editorContext";

  import Action from "./Action.svelte";

  const ctx = getEditorContext();
</script>

<Action
  title={t("overwriteConfirm.action.exportToImage.title")}
  actionLabel={t("overwriteConfirm.action.exportToImage.button")}
  onClick={() => {
    ctx.actionManager.executeAction(actionChangeExportEmbedScene, "ui", true);
    ctx.setAppState({ openDialog: { name: "imageExport" } });
  }}
>
  {t("overwriteConfirm.action.exportToImage.description")}
</Action>
