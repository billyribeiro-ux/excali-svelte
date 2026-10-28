<script lang="ts">
  import { isLineElement } from "@svelte-draw/element";

  import IconButton from "../../components/IconButton.svelte";
  import { polygonIcon } from "../../components/icons";
  import { t } from "../../i18n";

  import type { ActionPanelProps } from "../types";

  let { appState, updateData, app }: ActionPanelProps = $props();

  const selectedElements = $derived(
    app.scene.getSelectedElements({
      selectedElementIds: appState.selectedElementIds,
    }),
  );

  const visible = $derived(
    selectedElements.length > 0 &&
      !selectedElements.some(
        (element) =>
          !isLineElement(element) ||
          // only show polygon button if every selected element is already
          // a polygon, effectively showing this button only to allow for
          // disabling the polygon state
          !element.polygon ||
          element.points.length < 3,
      ),
  );

  const allPolygon = $derived(
    selectedElements.every(
      (element) => isLineElement(element) && element.polygon,
    ),
  );

  const label = $derived(
    t(
      allPolygon
        ? "labels.polygon.breakPolygon"
        : "labels.polygon.convertToPolygon",
    ),
  );
</script>

{#if visible}
  <IconButton
    type="toggle"
    icon={polygonIcon}
    title={label}
    aria-label={label}
    checked={allPolygon}
    onSelect={() => updateData(null)}
    style="margin-left: auto"
  />
{/if}
