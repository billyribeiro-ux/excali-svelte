<script lang="ts">
  import { setEditorContext } from "./editorContext";

  import type { Component } from "svelte";
  import type { EditorContextValue } from "./editorContext";

  /** Test harness: renders `component` with `props` inside an editor context. */
  let {
    component: Content,
    props = {},
    ctx,
  }: {
    component: Component<any>;
    props?: Record<string, unknown>;
    ctx: EditorContextValue;
  } = $props();

  // svelte-ignore state_referenced_locally
  setEditorContext(ctx);
</script>

<Content {...props} />
