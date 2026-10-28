<script lang="ts">
  import { Popover } from "bits-ui";

  import ActionPanel from "../actions/ActionPanel.svelte";
  import {
    restoreCaretPosition,
    saveCaretPosition,
    type CaretPosition,
  } from "../hooks/textEditorFocus.svelte";
  import { t } from "../i18n";
  import { getEditorContext } from "../ui/editorContext";

  import { PROPERTIES_CLASSES } from "./Actions";
  import Icon from "./Icon.svelte";
  import { TextSizeIcon } from "./icons";
  import PropertiesPopover from "./PropertiesPopover.svelte";

  import type { ShapeActionPredicates } from "./shapeActionPredicates";
  import type { UIAppState } from "../types";

  let {
    appState,
    predicates,
  }: { appState: UIAppState; predicates: ShapeActionPredicates } = $props();

  const ctx = getEditorContext();

  // caret position saved while the popover is open (replaces the state kept
  // by `useTextEditorFocus`)
  let savedCaret: CaretPosition | null = null;

  const ownerDocument = () => ctx.container?.ownerDocument ?? document;

  const save = () => {
    savedCaret = saveCaretPosition(ownerDocument());
  };
  const restore = () => {
    restoreCaretPosition(savedCaret, ownerDocument());
    savedCaret = null;
  };

  const isOpen = $derived(appState.openPopup === "compactTextProperties");
</script>

<div class="compact-action-item">
  <Popover.Root
    open={isOpen}
    onOpenChange={(open) => {
      if (open) {
        if (appState.editingTextElement) {
          save();
        }
        ctx.setAppState({ openPopup: "compactTextProperties" });
      } else {
        ctx.setAppState({ openPopup: null });
        if (appState.editingTextElement) {
          restore();
        }
      }
    }}
  >
    <Popover.Trigger
      type="button"
      class={["compact-action-button properties-trigger", { active: isOpen }]}
      title={t("labels.textAlign")}
      onclick={(e: MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <Icon icon={TextSizeIcon} />
    </Popover.Trigger>
    {#if isOpen}
      <PropertiesPopover
        class={PROPERTIES_CLASSES}
        container={ctx.container}
        style="max-width: 13rem;"
        preventAutoFocusOnTouch={!!appState.editingTextElement}
        onClose={() => {
          // Refocus text editor when popover closes with caret restoration
          if (appState.editingTextElement) {
            restore();
          }
        }}
      >
        <div class="selected-shape-actions">
          {#if predicates.text}<ActionPanel name="changeFontSize" />{/if}
          {#if predicates.textAlign}<ActionPanel name="changeTextAlign" />{/if}
          {#if predicates.verticalAlign}<ActionPanel name="changeVerticalAlign" />{/if}
        </div>
      </PropertiesPopover>
    {/if}
  </Popover.Root>
</div>
