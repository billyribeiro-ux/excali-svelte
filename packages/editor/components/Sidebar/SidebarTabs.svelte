<script lang="ts">
  import { Tabs } from "bits-ui";

  import { getEditorContext } from "../../ui/editorContext";

  import type { Snippet } from "svelte";
  import type { HTMLAttributes } from "svelte/elements";

  let {
    children,
    ...rest
  }: { children: Snippet } & Omit<
    HTMLAttributes<HTMLDivElement>,
    "children" | "onselect"
  > = $props();

  const ctx = getEditorContext();
  const openSidebar = $derived(ctx.appState.openSidebar);
</script>

{#if openSidebar}
  <Tabs.Root
    class="sidebar-tabs-root"
    value={openSidebar.tab}
    onValueChange={(tab) =>
      ctx.setAppState((state) => ({
        ...state,
        openSidebar: { ...state.openSidebar, name: openSidebar.name, tab },
      }))}
    {...(rest as Record<string, any>)}
  >
    {@render children()}
  </Tabs.Root>
{/if}
