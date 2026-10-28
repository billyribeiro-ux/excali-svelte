<script lang="ts">
  import { setEditorContext } from "../ui/editorContext";

  import Section from "./Section.svelte";

  import type { EditorContextValue } from "../ui/editorContext";

  let { ctx }: { ctx: EditorContextValue } = $props();

  // svelte-ignore state_referenced_locally
  setEditorContext(ctx);
</script>

<Section heading="shapes">
  {#snippet content(heading)}
    <div class="wrap">
      <i>marker</i>
      {@render heading()}
    </div>
  {/snippet}
</Section>
