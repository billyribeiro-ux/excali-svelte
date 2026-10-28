<script lang="ts">
  import { Popover } from "bits-ui";
  import { createRawSnippet } from "svelte";

  import { setEditorContext } from "../ui/editorContext";

  import PropertiesPopover from "./PropertiesPopover.svelte";

  import type { EditorContextValue } from "../ui/editorContext";

  let {
    ctx,
    container,
    onClose,
    onkeydown,
    initialOpen = true,
  }: {
    ctx: EditorContextValue;
    container: HTMLDivElement | null;
    onClose: () => void;
    onkeydown?: (event: KeyboardEvent) => void;
    initialOpen?: boolean;
  } = $props();

  // svelte-ignore state_referenced_locally
  setEditorContext(ctx);

  // svelte-ignore state_referenced_locally
  let open = $state(initialOpen);

  export const setOpen = (next: boolean) => {
    open = next;
  };

  const content = createRawSnippet(() => ({
    render: () => '<span data-testid="popover-body">body</span>',
  }));
</script>

<Popover.Root bind:open>
  <Popover.Trigger>trigger</Popover.Trigger>
  {#if open}
    <PropertiesPopover
      {container}
      class="custom-class"
      style="max-width: 13rem;"
      {onClose}
      {onkeydown}
      children={content}
    />
  {/if}
</Popover.Root>
