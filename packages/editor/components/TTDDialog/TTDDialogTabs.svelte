<script lang="ts">
  import { Tabs } from "bits-ui";

  import { isMemberOf } from "@svelte-draw/common";

  import { getEditorContext } from "../../ui/editorContext";

  import type { Snippet } from "svelte";

  let {
    dialog,
    tab,
    children,
  }: {
    dialog: "ttd";
    tab: "text-to-diagram" | "mermaid";
    children: Snippet;
  } = $props();

  const editor = getEditorContext();

  let rootEl = $state<HTMLElement | null>(null);
  let minHeight = 0;

  const onValueChange = (
    // at least in test enviros, `tab` can be `undefined`
    nextTab: string | undefined,
  ) => {
    if (!nextTab) {
      return;
    }
    const modalContentNode =
      rootEl?.closest<HTMLElement>(".Modal__content") ?? null;
    if (modalContentNode) {
      const currHeight = modalContentNode.offsetHeight || 0;
      if (currHeight > minHeight) {
        minHeight = currHeight;
        modalContentNode.style.minHeight = `min(${minHeight}px, 100%)`;
      }
    }
    if (dialog === "ttd" && isMemberOf(["text-to-diagram", "mermaid"], nextTab)) {
      editor.setAppState({
        openDialog: { name: dialog, tab: nextTab },
      });
    }
  };
</script>

<Tabs.Root
  bind:ref={rootEl}
  class="ttd-dialog-tabs-root"
  value={tab}
  {onValueChange}
>
  {@render children()}
</Tabs.Root>
