<script lang="ts">
  import { setEditorContext, type EditorContextValue } from "../ui/editorContext";
  import SearchMenu from "./SearchMenu.svelte";

  let { ctx }: { ctx: EditorContextValue } = $props();
  // svelte-ignore state_referenced_locally
  setEditorContext(ctx);
</script>

<SearchMenu />
