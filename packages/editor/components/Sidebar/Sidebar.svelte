<script lang="ts">
  import { onMount, untrack } from "svelte";

  import { getEditorContext } from "../../ui/editorContext";

  import SidebarInner from "./SidebarInner.svelte";

  import type { SidebarProps } from "./common";

  let {
    name,
    children,
    onStateChange,
    onDock,
    docked,
    class: className,
    element = $bindable(null),
  }: SidebarProps = $props();

  const ctx = getEditorContext();

  // reports open/close/tab changes of this sidebar to the host
  let prevOpenSidebar = ctx.appState.openSidebar;
  $effect(() => {
    const openSidebar = ctx.appState.openSidebar;
    // read here so a changed callback / name re-runs the effect, like the
    // React dependency array
    const callback = onStateChange;
    const sidebarName = name;

    if (
      // closing sidebar
      ((!openSidebar && prevOpenSidebar?.name === sidebarName) ||
        // opening current sidebar
        (openSidebar?.name === sidebarName &&
          prevOpenSidebar?.name !== sidebarName) ||
        // switching tabs or switching to a different sidebar
        prevOpenSidebar?.name === sidebarName) &&
      openSidebar !== prevOpenSidebar
    ) {
      untrack(() => {
        callback?.(openSidebar?.name !== sidebarName ? null : openSidebar);
      });
    }
    prevOpenSidebar = openSidebar;
  });

  // We want to render in the next tick (hence `mounted` flag) so that it's
  // guaranteed to happen after unmount of the previous sidebar (in case the
  // previous sidebar is mounted after the next one). This is necessary to
  // prevent flicker of subcomponents that support fallbacks
  // (e.g. SidebarHeader).
  let mounted = $state(false);
  onMount(() => {
    mounted = true;
    return () => {
      mounted = false;
    };
  });

  const shouldRender = $derived(
    mounted && ctx.appState.openSidebar?.name === name,
  );
</script>

{#if shouldRender}
  {#key name}
    <SidebarInner
      {name}
      {onDock}
      {docked}
      class={className}
      bind:element
      {children}
    />
  {/key}
{/if}
