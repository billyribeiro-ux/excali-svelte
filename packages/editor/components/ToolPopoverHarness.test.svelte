<script lang="ts">
  import { setEditorContext } from "../ui/editorContext";

  import ToolPopover from "./ToolPopover.svelte";

  import type { EditorContextValue } from "../ui/editorContext";

  let {
    ctx,
    app,
    options,
    activeToolType,
    defaultOption,
    displayedOption,
    onToolChange,
  }: {
    ctx: EditorContextValue;
    app: any;
    options: any[];
    activeToolType: string;
    defaultOption: string;
    displayedOption: any;
    onToolChange: (type: string) => void;
  } = $props();

  // svelte-ignore state_referenced_locally
  setEditorContext(ctx);

  // svelte-ignore state_referenced_locally
  let currentType = $state(activeToolType);

  /** like the editor committing a new `appState.activeTool` */
  export const setActiveToolType = (type: string) => {
    currentType = type;
  };
</script>

<ToolPopover
  {app}
  {options}
  activeTool={{ type: currentType }}
  {defaultOption}
  data-testid="toolbar-line-group"
  onToolChange={(type) => {
    // the editor activates the tool
    currentType = type;
    onToolChange(type);
  }}
  {displayedOption}
/>
