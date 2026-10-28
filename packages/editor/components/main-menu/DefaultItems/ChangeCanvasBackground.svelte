<script lang="ts">
  import ActionPanel from "../../../actions/ActionPanel.svelte";
  import { t } from "../../../i18n";
  import { getEditorContext } from "../../../ui/editorContext";

  const ctx = getEditorContext();
</script>

{#if !ctx.appState.viewModeEnabled && ctx.props.UIOptions.canvasActions.changeViewBackgroundColor}
  <div style="margin-top: 0.75rem;">
    <div
      data-testid="canvas-background-label"
      style="font-size: 0.875rem; margin-bottom: 0.25rem; margin-left: 0.5rem;"
    >
      {t("labels.canvasBackground")}
    </div>
    <div style="padding: 0 0.625rem;">
      <ActionPanel name="changeViewBackgroundColor" />
    </div>
  </div>
{/if}
