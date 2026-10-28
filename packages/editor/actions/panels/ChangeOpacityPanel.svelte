<script lang="ts">
  import Range from "../../components/Range.svelte";
  import { t } from "../../i18n";

  import { getFormValue } from "./propertiesHelpers";

  import type { ActionPanelProps } from "../types";

  let { elements, appState, updateData, app }: ActionPanelProps = $props();

  const opacity = $derived(
    getFormValue(
      elements,
      app,
      (element) => element.opacity,
      true,
      (hasSelection) => (hasSelection ? null : appState.currentItemOpacity),
    ),
  );
</script>

<Range
  label={t("labels.opacity")}
  value={opacity ?? appState.currentItemOpacity}
  hasCommonValue={opacity !== null}
  onChange={(value: number) => updateData(value)}
  min={0}
  max={100}
  step={10}
  testId="opacity"
/>
