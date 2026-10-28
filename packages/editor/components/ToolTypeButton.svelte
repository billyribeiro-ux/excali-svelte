<script lang="ts">
  import { capitalizeString } from "@svelte-draw/common";

  import { trackEvent } from "../analytics";
  import { t } from "../i18n";

  import IconButton from "./IconButton.svelte";
  import {
    getToolLetter,
    getToolShortcut,
    isToolButtonDisabled,
    TOOLS,
    type ToolbarToolType,
    type ToolButtonBehavior,
    type ToolButtonComponentProps,
  } from "./Tools";

  // Generic toolbar button for a tool (replaces `createToolButton(type)`).
  // Activation is uniform: track + `setActiveTool` (recording the previous
  // tool for toggle tools), with pen detection on the first pen interaction.
  let {
    type,
    behavior,
    app,
    activeTool,
    hideKeyBinding,
    hideShortcut,
  }: ToolButtonComponentProps & {
    type: ToolbarToolType;
    behavior?: ToolButtonBehavior;
  } = $props();

  const config = $derived(TOOLS[type]);
  const shortcutType = $derived(behavior?.shortcutType ?? type);
  const label = $derived(capitalizeString(t(`toolBar.${type}`)));
  const shortcut = $derived(hideShortcut ? null : getToolShortcut(shortcutType));
</script>

<IconButton
  class={{ fillable: config.fillable }}
  type="toggle"
  icon={config.icon}
  checked={activeTool.type === type}
  disabled={isToolButtonDisabled(app, type)}
  title={shortcut ? `${label} — ${shortcut}` : label}
  keyBindingLabel={hideKeyBinding || hideShortcut
    ? undefined
    : getToolLetter(shortcutType) || TOOLS[shortcutType].numericKey}
  aria-label={label}
  aria-keyshortcuts={shortcut ?? undefined}
  data-testid={`toolbar-${type}`}
  onpointerdown={(event: PointerEvent) => {
    // a draggable tool can be dragged out onto the canvas; a press that
    // stays put is still a click (`onSelect`)
    app.toolDrag.handleButtonPointerDown(type, event);
  }}
  onSelect={({ pointerType }) => {
    if (!app.state.penDetected && pointerType === "pen") {
      app.togglePenMode(true);
    }

    if (behavior?.onSelect) {
      behavior.onSelect(app, { pointerType });
      return;
    }

    if (app.state.activeTool.type !== type) {
      trackEvent("toolbar", type, "ui");
      app.setActiveTool({ type });
    }
  }}
/>
