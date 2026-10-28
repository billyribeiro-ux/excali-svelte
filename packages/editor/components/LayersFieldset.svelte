<script lang="ts">
  import ActionPanel from "../actions/ActionPanel.svelte";
  import { t } from "../i18n";

  // The "arrange" (z-order) fieldset, identical across every styles-panel layout.
</script>

<fieldset>
  <legend>{t("labels.layers")}</legend>
  <div class="buttonList">
    <ActionPanel name="sendToBack" />
    <ActionPanel name="sendBackward" />
    <ActionPanel name="bringForward" />
    <ActionPanel name="bringToFront" />
  </div>
</fieldset>
