<script lang="ts">
  import { setEditorContext, type EditorContextValue } from "../../ui/editorContext";
  import Hyperlink from "./Hyperlink.svelte";

  let { ctx, hyperlinkProps }: { ctx: EditorContextValue; hyperlinkProps: any } =
    $props();
  // svelte-ignore state_referenced_locally
  setEditorContext(ctx);
</script>

<Hyperlink {...hyperlinkProps} />
