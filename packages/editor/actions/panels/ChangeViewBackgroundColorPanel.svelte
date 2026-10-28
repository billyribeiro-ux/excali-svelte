<script lang="ts">
  import { DEFAULT_CANVAS_BACKGROUND_PICKS } from "@svelte-draw/common";

  import ColorPicker from "../../components/ColorPicker/ColorPicker.svelte";
  import { t } from "../../i18n";

  import type { ActionPanelProps } from "../types";

  let { elements, appState, updateData }: ActionPanelProps = $props();
</script>

<!-- FIXME move me to components/main-menu/DefaultItems -->
<ColorPicker
  palette={null}
  topPicks={DEFAULT_CANVAS_BACKGROUND_PICKS}
  label={t("labels.canvasBackground")}
  type="canvasBackground"
  color={appState.viewBackgroundColor}
  onChange={(color: string) => updateData({ viewBackgroundColor: color })}
  data-testid="canvas-background-picker"
  {elements}
  {appState}
  {updateData}
/>
