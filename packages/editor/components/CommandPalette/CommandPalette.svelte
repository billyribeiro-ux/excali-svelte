<script lang="ts">
  import { trackEvent } from "../../analytics";
  import { getEditorContext } from "../../ui/editorContext";

  import CommandPaletteInner from "./CommandPaletteInner.svelte";
  import { isCommandPaletteToggleShortcut } from "./categories";

  import type { CommandPaletteItem } from "./types";

  type Props = {
    customCommandPaletteItems?: CommandPaletteItem[];
  };

  let { customCommandPaletteItems }: Props = $props();

  const ctx = getEditorContext();

  const commandPaletteShortcut = (event: KeyboardEvent) => {
    if (isCommandPaletteToggleShortcut(event)) {
      event.preventDefault();
      event.stopPropagation();
      ctx.setAppState((appState) => {
        const nextState =
          appState.openDialog?.name === "commandPalette"
            ? null
            : ({ name: "commandPalette" } as const);

        if (nextState) {
          trackEvent("command_palette", "open", "shortcut");
        }

        return {
          openDialog: nextState,
        };
      });
    }
  };
</script>

<svelte:window onkeydowncapture={commandPaletteShortcut} />

{#if ctx.appState.openDialog?.name === "commandPalette"}
  <CommandPaletteInner {customCommandPaletteItems} />
{/if}
