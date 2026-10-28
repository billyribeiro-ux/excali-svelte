<script lang="ts">
  import { Popover } from "bits-ui";

  import ActionPanel from "../actions/ActionPanel.svelte";
  import { t } from "../i18n";
  import { getEditorContext } from "../ui/editorContext";

  import { PROPERTIES_CLASSES } from "./Actions";
  import AlignFieldset from "./AlignFieldset.svelte";
  import Icon from "./Icon.svelte";
  import { DotsHorizontalIcon } from "./icons";
  import LayersFieldset from "./LayersFieldset.svelte";
  import PropertiesPopover from "./PropertiesPopover.svelte";

  import type { ShapeActionPredicates } from "./shapeActionPredicates";
  import type { UIAppState } from "../types";

  let {
    appState,
    predicates,
    showDuplicate,
    showDelete,
  }: {
    appState: UIAppState;
    predicates: ShapeActionPredicates;
    showDuplicate?: boolean;
    showDelete?: boolean;
  } = $props();

  const ctx = getEditorContext();

  const isOpen = $derived(appState.openPopup === "compactOtherProperties");
</script>

{#if predicates.showExtraActions}
  <div class="compact-action-item">
    <Popover.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (open) {
          ctx.setAppState({ openPopup: "compactOtherProperties" });
        } else {
          ctx.setAppState({ openPopup: null });
        }
      }}
    >
      <Popover.Trigger
        type="button"
        class={["compact-action-button properties-trigger", { active: isOpen }]}
        title={t("labels.actions")}
        onclick={(e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Icon icon={DotsHorizontalIcon} />
      </Popover.Trigger>
      {#if isOpen}
        <PropertiesPopover
          class={PROPERTIES_CLASSES}
          container={ctx.container}
          style="max-width: 12rem; justify-content: center; align-items: center;"
          onClose={() => {}}
        >
          <div class="selected-shape-actions">
            {#if predicates.layers}<LayersFieldset />{/if}

            {#if predicates.align}
              <AlignFieldset showDistribute={predicates.distribute} />
            {/if}
            <fieldset>
              <legend>{t("labels.actions")}</legend>
              <div class="buttonList">
                <ActionPanel name="group" />
                <ActionPanel name="ungroup" />
                {#if predicates.linkSingleOnly}<ActionPanel name="hyperlink" />{/if}
                {#if predicates.cropEditor}<ActionPanel name="cropEditor" />{/if}
                {#if showDuplicate}<ActionPanel name="duplicateSelection" />{/if}
                {#if showDelete}<ActionPanel name="deleteSelectedElements" />{/if}
              </div>
            </fieldset>
          </div>
        </PropertiesPopover>
      {/if}
    </Popover.Root>
  </div>
{/if}
