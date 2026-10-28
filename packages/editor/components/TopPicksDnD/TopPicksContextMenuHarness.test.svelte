<script lang="ts">
  import { setEditorContext } from "../../ui/editorContext";

  import TopPicksContextMenu from "./TopPicksContextMenu.svelte";

  import type { EditorContextValue } from "../../ui/editorContext";

  let {
    ctx,
    onReset,
    isCustomized,
  }: {
    ctx: EditorContextValue;
    onReset?: () => void;
    isCustomized: boolean;
  } = $props();

  // svelte-ignore state_referenced_locally
  setEditorContext(ctx);
</script>

<TopPicksContextMenu {onReset} {isCustomized} resetLabel="Reset picks">
  {#snippet children(props)}
    <div {...props} data-testid="strip">strip</div>
  {/snippet}
</TopPicksContextMenu>
