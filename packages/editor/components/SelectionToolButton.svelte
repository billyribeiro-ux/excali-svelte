<script lang="ts">
  import { trackEvent } from "../analytics";

  import ToolTypeButton from "./ToolTypeButton.svelte";

  import type { ToolButtonBehavior, ToolButtonComponentProps } from "./Tools";

  // The selection tool button — pointer-clicking it while the selection tool
  // is active switches to lasso.
  let props: ToolButtonComponentProps = $props();

  const behavior: ToolButtonBehavior = {
    onSelect: (app, { pointerType }) => {
      if (app.state.activeTool.type === "selection" && pointerType !== null) {
        // pointer-clicking the active selection tool switches to lasso;
        // keyboard/AT activation stays on selection
        app.setActiveTool({ type: "lasso" });
        return;
      }

      if (app.state.activeTool.type !== "selection") {
        trackEvent("toolbar", "selection", "ui");
        app.setActiveTool({ type: "selection" });
      }
    },
  };
</script>

<ToolTypeButton type="selection" {...props} {behavior} />
