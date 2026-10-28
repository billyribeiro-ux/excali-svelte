<script lang="ts">
  import { Popover } from "bits-ui";

  import { isArrowElement } from "@svelte-draw/element";

  import type { ExcalidrawElement } from "@svelte-draw/element/types";

  import ActionPanel from "../actions/ActionPanel.svelte";
  import { getFormValue } from "../actions/actionProperties";
  import { t } from "../i18n";
  import { getEditorContext } from "../ui/editorContext";

  import Icon from "./Icon.svelte";
  import { elbowArrowIcon, roundArrowIcon, sharpArrowIcon } from "./icons";
  import PropertiesPopover from "./PropertiesPopover.svelte";

  import type { ShapeActionPredicates } from "./shapeActionPredicates";
  import type { AppClassProperties, UIAppState } from "../types";

  let {
    appState,
    targetElements,
    predicates,
    app,
  }: {
    appState: UIAppState;
    targetElements: ExcalidrawElement[];
    predicates: ShapeActionPredicates;
    app: AppClassProperties;
  } = $props();

  const ctx = getEditorContext();

  const isOpen = $derived(appState.openPopup === "compactArrowProperties");

  // Show an icon based on the current arrow type
  const triggerIcon = $derived.by(() => {
    const arrowType = getFormValue(
      targetElements,
      app,
      (element) => {
        if (isArrowElement(element)) {
          return element.elbowed
            ? "elbow"
            : element.roundness
            ? "round"
            : "sharp";
        }
        return null;
      },
      (element) => isArrowElement(element),
      (hasSelection) => (hasSelection ? null : appState.currentItemArrowType),
    );

    if (arrowType === "elbow") {
      return elbowArrowIcon;
    }
    if (arrowType === "round") {
      return roundArrowIcon;
    }
    return sharpArrowIcon;
  });
</script>

{#if predicates.arrowType}
  <div class="compact-action-item">
    <Popover.Root
      open={isOpen}
      onOpenChange={(open) => {
        if (open) {
          ctx.setAppState({ openPopup: "compactArrowProperties" });
        } else {
          ctx.setAppState({ openPopup: null });
        }
      }}
    >
      <Popover.Trigger
        type="button"
        class={["compact-action-button properties-trigger", { active: isOpen }]}
        title={t("labels.arrowtypes")}
        onclick={(e: MouseEvent) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <Icon icon={triggerIcon} />
      </Popover.Trigger>
      {#if isOpen}
        <PropertiesPopover
          container={ctx.container}
          class="properties-content"
          style="max-width: 13rem;"
          onClose={() => {}}
        >
          <ActionPanel name="changeArrowProperties" />
        </PropertiesPopover>
      {/if}
    </Popover.Root>
  </div>
{/if}
