<script lang="ts">
  import { setEditorContext } from "../../ui/editorContext";

  import CommandPalette from "./CommandPalette.svelte";

  import type { EditorContextValue } from "../../ui/editorContext";
  import type { CommandPaletteItem } from "./types";

  let {
    editor,
    customCommandPaletteItems,
  }: {
    editor: EditorContextValue;
    customCommandPaletteItems?: CommandPaletteItem[];
  } = $props();

  // the context is created once per test and never swapped
  // svelte-ignore state_referenced_locally
  setEditorContext(editor);
</script>

<CommandPalette {customCommandPaletteItems} />
