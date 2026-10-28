<script lang="ts">
  import { t } from "../../i18n";
  import Ellipsify from "../Ellipsify.svelte";
  import InlineIcon from "../InlineIcon.svelte";

  import CommandShortcutHint from "./CommandShortcutHint.svelte";
  import LibraryItemIcon from "./LibraryItemIcon.svelte";

  import type { UIAppState } from "../../types";
  import type { CommandPaletteItem } from "./types";

  type Props = {
    command: CommandPaletteItem;
    isSelected: boolean;
    disabled?: boolean;
    onmousemove: () => void;
    onclick: (event: MouseEvent) => void;
    showShortcut: boolean;
    appState: UIAppState;
    size?: "small" | "large";
  };

  let {
    command,
    isSelected,
    disabled,
    onmousemove,
    onclick,
    showShortcut,
    appState,
    size = "small",
  }: Props = $props();

  const icon = $derived(
    typeof command.icon === "function"
      ? command.icon(appState, [])
      : command.icon,
  );

  const scrollIntoViewIfSelected = (node: HTMLDivElement) => {
    if (isSelected && !disabled) {
      node.scrollIntoView?.({ block: "nearest" });
    }
  };
</script>

<!-- keyboard interaction is handled globally by the command palette -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
<div
  class={[
    "command-item",
    {
      "item-selected": isSelected,
      "item-disabled": disabled,
      "command-item-large": size === "large",
    },
  ]}
  {@attach scrollIntoViewIfSelected}
  onclick={disabled ? undefined : onclick}
  onmousemove={disabled ? undefined : onmousemove}
  title={disabled ? t("commandPalette.itemNotAvailable") : ""}
>
  <div class="name">
    {#if command.libraryIcon}
      <span
        class="icon"
        style="width: var(--icon-size, 1rem); height: 100%; margin: 0 0.5ex 0 0.5ex; display: inline-flex; line-height: 0; vertical-align: middle; flex: 0 0 auto;"
      >
        <LibraryItemIcon
          id={command.libraryIcon.id}
          elements={command.libraryIcon.elements}
        />
      </span>
    {:else if icon}
      <InlineIcon class="icon" size="var(--icon-size, 1rem)" {icon} />
    {/if}
    <Ellipsify>{command.label}</Ellipsify>
  </div>
  {#if showShortcut && command.shortcut}
    <CommandShortcutHint shortcut={command.shortcut} />
  {/if}
</div>
