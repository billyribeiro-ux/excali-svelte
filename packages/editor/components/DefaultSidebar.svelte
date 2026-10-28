<script lang="ts">
  import {
    CANVAS_SEARCH_TAB,
    LIBRARY_SIDEBAR_TAB,
    composeEventHandlers,
  } from "@svelte-draw/common";

  import { getTunnels } from "../context/tunnels";
  import { getEditorContext } from "../ui/editorContext";
  import TunnelOut from "../ui/TunnelOut.svelte";

  import "./dropdownMenu/DropdownMenu.scss";

  import Icon from "./Icon.svelte";
  import { useInternalFallback } from "./hoc/withInternalFallback.svelte";
  import { LibraryIcon, searchIcon } from "./icons";
  import LibraryMenu from "./LibraryMenu.svelte";
  import SearchMenu from "./SearchMenu.svelte";
  import { Sidebar } from "./Sidebar/Sidebar";

  import type { Snippet } from "svelte";
  import type { SidebarProps } from "./Sidebar/common";

  type Props = Omit<SidebarProps, "name" | "children" | "onDock" | "element"> & {
    children?: Snippet;
    /** pass `false` to disable docking */
    onDock?: SidebarProps["onDock"] | false;
  };

  let {
    children,
    class: className,
    onDock,
    docked,
    onStateChange,
    __fallback,
  }: Props = $props();

  const ctx = getEditorContext();
  const tunnels = getTunnels();
  const fallback = useInternalFallback("DefaultSidebar", () => __fallback);

  const isForceDocked = $derived(
    ctx.appState.openSidebar?.tab === CANVAS_SEARCH_TAB,
  );

  const resolvedDocked = $derived(
    isForceDocked || (docked ?? ctx.appState.defaultSidebarDockedPreference),
  );

  const resolvedOnDock = $derived(
    // `onDock=false` disables docking.
    // if `docked` passed, but no onDock passed, disable manual docking.
    isForceDocked || onDock === false || (!onDock && docked != null)
      ? undefined
      : // compose to allow the host app to listen on default behavior
        composeEventHandlers(onDock, (docked: boolean) => {
          ctx.setAppState({ defaultSidebarDockedPreference: docked });
        }),
  );
</script>

{#if fallback.shouldRender}
  <Sidebar
    {onStateChange}
    name="default"
    class={["default-sidebar", className]}
    docked={resolvedDocked}
    onDock={resolvedOnDock}
  >
    <Sidebar.Tabs>
      <Sidebar.Header>
        <Sidebar.TabTriggers>
          <Sidebar.TabTrigger tab={CANVAS_SEARCH_TAB}>
            <Icon icon={searchIcon} />
          </Sidebar.TabTrigger>
          <Sidebar.TabTrigger tab={LIBRARY_SIDEBAR_TAB}>
            <Icon icon={LibraryIcon} />
          </Sidebar.TabTrigger>
          <TunnelOut tunnel={tunnels.DefaultSidebarTabTriggersTunnel} />
        </Sidebar.TabTriggers>
      </Sidebar.Header>
      <Sidebar.Tab tab={LIBRARY_SIDEBAR_TAB}>
        <LibraryMenu />
      </Sidebar.Tab>
      <Sidebar.Tab tab={CANVAS_SEARCH_TAB}>
        <SearchMenu />
      </Sidebar.Tab>
      {@render children?.()}
    </Sidebar.Tabs>
  </Sidebar>
{/if}
