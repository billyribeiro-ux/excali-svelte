<script lang="ts">
  import type { Component } from "svelte";

  import {
    setEditorContext,
    type EditorContextValue,
  } from "../ui/editorContext";

  let {
    component,
    componentProps = {},
    ctx,
  }: {
    component: Component<any>;
    componentProps?: Record<string, unknown>;
    ctx: EditorContextValue;
  } = $props();

  // svelte-ignore state_referenced_locally
  setEditorContext(ctx);

  const Inner = $derived(component);
</script>

<Inner {...componentProps} />
