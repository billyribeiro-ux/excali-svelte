<script lang="ts">
  import { getEditorContext } from "../ui/editorContext";

  import type { ActionName, ActionPanelProps } from "./types";

  // Svelte replacement of `ActionManager.renderAction(name, data)`.
  let { name, data }: { name: ActionName; data?: ActionPanelProps["data"] } =
    $props();

  const ctx = getEditorContext();

  // re-resolved whenever the editor commits (UIOptions / registered actions
  // may change with props)
  const panel = $derived.by(() => {
    void ctx.props;
    return ctx.actionManager.getPanel(name);
  });

  const elements = $derived.by(() => {
    void ctx.elements;
    return ctx.actionManager.getElementsIncludingDeleted();
  });
  const appState = $derived(ctx.appState);
</script>

{#if panel}
  {@const Panel = panel.PanelComponent}
  <Panel
    {elements}
    {appState}
    updateData={panel.updateData}
    appProps={ctx.app.props}
    app={ctx.app}
    {data}
  />
{/if}
