<script lang="ts">
  import { capitalizeString } from "@svelte-draw/common";

  import { t } from "../i18n";
  import { getEditorContext } from "../ui/editorContext";

  import ToolPopover from "./ToolPopover.svelte";
  import { TOOLS } from "./Tools";

  import type { AppClassProperties, UIAppState } from "../types";

  // The selection ⇄ lasso popover used in compact (tablet) and mobile
  // toolbars; picking an option also makes it the preferred selection tool.
  let {
    app,
    activeTool,
  }: { app: AppClassProperties; activeTool: UIAppState["activeTool"] } =
    $props();

  const ctx = getEditorContext();

  const SELECTION_TOOLS = $derived([
    {
      type: "selection",
      icon: TOOLS.selection.icon,
      fillable: TOOLS.selection.fillable,
      title: capitalizeString(t("toolBar.selection")),
    },
    {
      type: "lasso",
      icon: TOOLS.lasso.icon,
      fillable: TOOLS.lasso.fillable,
      title: capitalizeString(t("toolBar.lasso")),
    },
  ] as const);

  const displayedOption = $derived(
    SELECTION_TOOLS.find(
      (tool) => tool.type === app.state.preferredSelectionTool.type,
    ) || SELECTION_TOOLS[0],
  );
</script>

<ToolPopover
  {app}
  options={SELECTION_TOOLS}
  {activeTool}
  defaultOption={app.state.preferredSelectionTool.type}
  data-testid="toolbar-selection"
  onToolChange={(type: string) => {
    if (type === "selection" || type === "lasso") {
      app.setActiveTool({ type });
      ctx.setAppState({
        preferredSelectionTool: { type, initialized: true },
      });
    }
  }}
  {displayedOption}
/>
