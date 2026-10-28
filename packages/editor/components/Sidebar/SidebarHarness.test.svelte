<script lang="ts">
  import { createTunnels, setTunnels } from "../../context/tunnels";
  import { setEditorContext } from "../../ui/editorContext";
  import TunnelOut from "../../ui/TunnelOut.svelte";
  import DefaultSidebar from "../DefaultSidebar.svelte";

  import { Sidebar } from "./Sidebar";

  import type { EditorContextValue } from "../../ui/editorContext";
  import type { AppState } from "../../types";

  type Scenario =
    | "content"
    | "header-custom"
    | "plain"
    | "header"
    | "tabs"
    | "default";

  let {
    ctx,
    scenario,
    name = "customSidebar",
    docked,
    onDock,
    onStateChange,
    className,
    /** extra props for the host `<DefaultSidebar>` (scenario `default`) */
    defaultProps = {},
    /** render `<DefaultSidebar __fallback>` as the editor does */
    defaultFallback = false,
  }: {
    ctx: EditorContextValue;
    scenario: Scenario;
    name?: string;
    docked?: boolean;
    onDock?: (docked: boolean) => void;
    onStateChange?: (state: AppState["openSidebar"]) => void;
    className?: string;
    withDefaultFallback?: boolean;
    defaultProps?: Record<string, unknown>;
    defaultFallback?: boolean;
  } = $props();

  const tunnels = createTunnels();
  setTunnels(tunnels);
  // svelte-ignore state_referenced_locally
  setEditorContext(ctx);
</script>

<div class="excalidraw-container">
  {#if scenario === "content"}
    <Sidebar {name} {docked} {onDock} {onStateChange} class={className}>
      <div id="test-sidebar-content">42</div>
    </Sidebar>
  {:else if scenario === "header-custom"}
    <Sidebar {name} {onStateChange}>
      <Sidebar.Header>
        <div id="test-sidebar-header-content">42</div>
      </Sidebar.Header>
    </Sidebar>
  {:else if scenario === "plain"}
    <Sidebar {name} class={className}>hello</Sidebar>
  {:else if scenario === "header"}
    <Sidebar {name} {docked} {onDock} {onStateChange} class={className}>
      <Sidebar.Header />
    </Sidebar>
  {:else if scenario === "tabs"}
    <Sidebar {name} {docked}>
      <Sidebar.Tabs>
        <Sidebar.Tab tab="library">Library</Sidebar.Tab>
        <Sidebar.Tab tab="comments">Comments</Sidebar.Tab>
      </Sidebar.Tabs>
    </Sidebar>
  {:else if scenario === "default"}
    <DefaultSidebar {...defaultProps} />
  {/if}
  {#if defaultFallback}
    <DefaultSidebar __fallback />
  {/if}
  <TunnelOut tunnel={tunnels.DefaultSidebarTabTriggersTunnel} />
</div>
