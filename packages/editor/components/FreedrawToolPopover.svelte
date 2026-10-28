<script lang="ts">
  import { capitalizeString } from "@svelte-draw/common";

  import { t } from "../i18n";

  import ToolPopover from "./ToolPopover.svelte";
  import { TOOLS } from "./Tools";

  import type { AppClassProperties, UIAppState } from "../types";

  // The freedraw ⇄ draw-shape popover used in compact (tablet) and mobile
  // toolbars. The trigger remembers and displays the most recently used option.
  let {
    app,
    activeTool,
  }: { app: AppClassProperties; activeTool: UIAppState["activeTool"] } =
    $props();

  const DRAWING_TOOLS = $derived([
    {
      type: "freedraw",
      icon: TOOLS.freedraw.icon,
      fillable: TOOLS.freedraw.fillable,
      title: capitalizeString(t("toolBar.freedraw")),
    },
    {
      type: "autoshape",
      icon: TOOLS.autoshape.icon,
      fillable: TOOLS.autoshape.fillable,
      title: capitalizeString(t("toolBar.autoshape")),
    },
  ] as const);

  // svelte-ignore state_referenced_locally
  let lastDrawingTool = $state<"freedraw" | "autoshape">(
    activeTool.type === "autoshape" ? "autoshape" : "freedraw",
  );

  $effect(() => {
    const type = activeTool.type;
    if (type === "freedraw" || type === "autoshape") {
      lastDrawingTool = type;
    }
  });

  const displayedOption = $derived(
    DRAWING_TOOLS.find((tool) => tool.type === lastDrawingTool) ||
      DRAWING_TOOLS[0],
  );
</script>

<ToolPopover
  {app}
  options={DRAWING_TOOLS}
  {activeTool}
  defaultOption={lastDrawingTool}
  data-testid="toolbar-freedraw"
  onToolChange={(type: string) => {
    if (type === "freedraw" || type === "autoshape") {
      lastDrawingTool = type;
      app.setActiveTool({ type });
    }
  }}
  {displayedOption}
/>
