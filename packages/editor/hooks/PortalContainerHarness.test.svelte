<script lang="ts">
  import { setEditorContext } from "../ui/editorContext";

  import { createPortalContainer } from "./portalContainer.svelte";

  import type { EditorContextValue } from "../ui/editorContext";

  let {
    ctx,
    opts,
    onDiv,
  }: {
    ctx: EditorContextValue;
    opts?: { className?: string; parentSelector?: string };
    onDiv?: (div: HTMLDivElement | null) => void;
  } = $props();

  // svelte-ignore state_referenced_locally
  setEditorContext(ctx);

  const container = createPortalContainer(() => opts);

  $effect(() => {
    onDiv?.(container.div);
  });
</script>
