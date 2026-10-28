<script lang="ts">
  import IconButton from "../../components/IconButton.svelte";
  import { lineEditorIcon } from "../../components/icons";
  import { t } from "../../i18n";

  import type { ExcalidrawLinearElement } from "@svelte-draw/element/types";
  import type { ActionPanelProps } from "../types";

  let { appState, updateData, app }: ActionPanelProps = $props();

  const selectedElement = $derived(
    app.scene.getSelectedElements({
      selectedElementIds: appState.selectedElementIds,
    })[0] as ExcalidrawLinearElement | undefined,
  );

  const label = $derived(
    selectedElement
      ? t(
          selectedElement.type === "arrow"
            ? "labels.lineEditor.editArrow"
            : "labels.lineEditor.edit",
        )
      : "",
  );
</script>

{#if selectedElement}
  <IconButton
    type="button"
    icon={lineEditorIcon}
    title={label}
    aria-label={label}
    onclick={() => updateData(null)}
  />
{/if}
