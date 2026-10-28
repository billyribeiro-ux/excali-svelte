<script lang="ts">
  import { Popover } from "bits-ui";

  import ActionPanel from "../actions/ActionPanel.svelte";
  import { t } from "../i18n";
  import { getEditorContext } from "../ui/editorContext";

  import { PROPERTIES_CLASSES } from "./Actions";
  import Icon from "./Icon.svelte";
  import { adjustmentsIcon } from "./icons";
  import PropertiesPopover from "./PropertiesPopover.svelte";

  import type { ShapeActionPredicates } from "./shapeActionPredicates";
  import type { UIAppState } from "../types";

  let {
    appState,
    predicates,
  }: { appState: UIAppState; predicates: ShapeActionPredicates } = $props();

  const ctx = getEditorContext();

  const shouldShowCombinedProperties = $derived(
    predicates.hasSelection ||
      (appState.activeTool.type !== "selection" &&
        appState.activeTool.type !== "eraser" &&
        appState.activeTool.type !== "hand" &&
        appState.activeTool.type !== "laser" &&
        appState.activeTool.type !== "lasso"),
  );
  const isOpen = $derived(appState.openPopup === "compactStrokeStyles");
</script>

{#if shouldShowCombinedProperties}
  <div class="compact-action-item">
    <Popover.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (open) {
          ctx.setAppState({ openPopup: "compactStrokeStyles" });
        } else {
          ctx.setAppState({ openPopup: null });
        }
      }}
    >
      <Popover.Trigger
        type="button"
        class={["compact-action-button properties-trigger", { active: isOpen }]}
        title={t("labels.stroke")}
        onclick={(e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Icon icon={adjustmentsIcon} />
      </Popover.Trigger>
      {#if isOpen}
        <PropertiesPopover
          class={PROPERTIES_CLASSES}
          container={ctx.container}
          style="max-width: 13rem;"
          onClose={() => {}}
        >
          <div class="selected-shape-actions">
            {#if predicates.fill}<ActionPanel name="changeFillStyle" />{/if}
            {#if predicates.strokeWidth}<ActionPanel name="changeStrokeWidth" />{/if}
            <!-- in compact UI the freedraw pressure setting is rendered as a
                 standalone cycle button in the compact actions list; we render
                 it in the combined properties popup as well for clarity -->
            {#if predicates.freedrawMode}<ActionPanel name="changeFreedrawMode" />{/if}
            {#if predicates.strokeStyle}<ActionPanel name="changeStrokeStyle" />{/if}
            {#if predicates.sloppiness}<ActionPanel name="changeSloppiness" />{/if}
            {#if predicates.roundness}<ActionPanel name="changeRoundness" />{/if}
            {#if predicates.opacity}<ActionPanel name="changeOpacity" />{/if}
          </div>
        </PropertiesPopover>
      {/if}
    </Popover.Root>
  </div>
{/if}
