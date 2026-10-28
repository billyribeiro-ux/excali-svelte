<script lang="ts">
  import { Popover } from "bits-ui";

  import { capitalizeString } from "@svelte-draw/common";

  import { trackEvent } from "../analytics";
  import { getEditorContext } from "../ui/editorContext";

  import IconButton from "./IconButton.svelte";
  import { isToolButtonDisabled } from "./Tools";

  import type { AppClassProperties } from "../types";
  import type { IconDef } from "./icons";

  import "./ToolPopover.scss";

  type ToolOption = {
    type: string;
    icon: IconDef;
    title: string;
    fillable?: boolean;
  };

  type Props = {
    app: AppClassProperties;
    options: readonly ToolOption[];
    activeTool: { type: string };
    defaultOption: string;
    "data-testid": string;
    onToolChange: (type: string) => void;
    displayedOption: ToolOption;
  };

  let {
    app,
    options,
    activeTool,
    defaultOption,
    "data-testid": dataTestId,
    onToolChange,
    displayedOption,
  }: Props = $props();

  const SIDE_OFFSET = 16;
  const ctx = getEditorContext();

  let isPopupOpen = $state(false);
  const currentType = $derived(activeTool.type);
  const isActive = $derived(displayedOption.type === currentType);

  // the popup is anchored to the toggle button
  let buttonEl = $state<HTMLButtonElement | null>(null);

  // if currentType is not in options, close popup
  $effect.pre(() => {
    if (!options.some((o) => o.type === currentType) && isPopupOpen) {
      isPopupOpen = false;
    }
  });

  // Close popover when user starts interacting with the canvas (pointer down)
  $effect(() => {
    // app.onPointerDownEmitter emits when pointer down happens on canvas area
    const unsubscribe = app.onPointerDownEmitter.on(() => {
      isPopupOpen = false;
    });
    return () => unsubscribe?.();
  });
</script>

<!-- the open state is driven only by the toggle button's `onSelect` -->
<Popover.Root bind:open={() => isPopupOpen, () => {}}>
  <IconButton
    bind:element={buttonEl}
    class={{ fillable: displayedOption.fillable }}
    type="toggle"
    icon={displayedOption.icon}
    checked={isActive}
    disabled={options.every((option) => isToolButtonDisabled(app, option.type))}
    title={capitalizeString(displayedOption.title)}
    aria-label={capitalizeString(displayedOption.title)}
    data-testid={dataTestId}
    onSelect={() => {
      isPopupOpen = !isPopupOpen;
      onToolChange(defaultOption);
    }}
  />

  <Popover.Content
    class="tool-popover-content"
    sideOffset={SIDE_OFFSET}
    collisionBoundary={ctx.container ?? undefined}
    customAnchor={buttonEl}
    trapFocus={false}
  >
    {#each options as { type, icon, fillable } (type)}
      <IconButton
        class={{ fillable }}
        type="toggle"
        {icon}
        checked={currentType === type}
        disabled={isToolButtonDisabled(app, type)}
        title={capitalizeString(type)}
        aria-label={capitalizeString(type)}
        data-testid={`toolbar-${type}`}
        onSelect={() => {
          if (app.state.activeTool.type !== type) {
            trackEvent("toolbar", type, "ui");
            app.setActiveTool({ type: type as any });
            onToolChange?.(type);
          }
        }}
      />
    {/each}
  </Popover.Content>
</Popover.Root>
