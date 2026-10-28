<script lang="ts">
  import FallbackHarness from "./FallbackHarness.test.svelte";

  import type { EditorContextValue } from "../../ui/editorContext";

  let {
    ctxA,
    ctxB,
    hostA,
    hostB,
    hostAfterFallback = false,
  }: {
    ctxA: EditorContextValue;
    ctxB: EditorContextValue;
    hostA: boolean;
    hostB: boolean;
    hostAfterFallback?: boolean;
  } = $props();
</script>

<div>
  <FallbackHarness ctx={ctxA} host={hostA} {hostAfterFallback} />
  <FallbackHarness ctx={ctxB} host={hostB} {hostAfterFallback} />
</div>
