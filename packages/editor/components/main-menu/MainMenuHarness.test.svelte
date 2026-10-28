<script lang="ts">
  import { createTunnels, setTunnels } from "../../context/tunnels";
  import { setEditorContext } from "../../ui/editorContext";
  import TunnelOut from "../../ui/TunnelOut.svelte";

  import MainMenu from "./MainMenu";
  import MainMenuGroup from "./MainMenuGroup.svelte";
  import MainMenuSeparator from "./MainMenuSeparator.svelte";

  import type { EditorContextValue } from "../../ui/editorContext";

  let {
    ctx,
    onSelect,
    allowSystemTheme = false,
    systemTheme = "light",
  }: {
    ctx: EditorContextValue;
    onSelect?: (event: Event) => void;
    allowSystemTheme?: boolean;
    systemTheme?: "light" | "dark" | "system";
    withUserList?: boolean;
  } = $props();

  const tunnels = createTunnels();
  setTunnels(tunnels);
  // svelte-ignore state_referenced_locally
  setEditorContext(ctx);

  const { DefaultItems } = MainMenu;
</script>

<div class="excalidraw-container">
  <!-- host-declared menu content is teleported into the outlet below -->
  <MainMenu {onSelect}>
    <DefaultItems.LoadScene />
    <DefaultItems.SaveToActiveFile />
    <DefaultItems.Export />
    <DefaultItems.SaveAsImage />
    <DefaultItems.CommandPalette />
    <DefaultItems.SearchMenu />
    <DefaultItems.Help />
    <DefaultItems.ClearCanvas />
    <MainMenuSeparator />
    <MainMenuGroup title="Links">
      <DefaultItems.Socials />
    </MainMenuGroup>
    <MainMenuSeparator />
    {#if allowSystemTheme}
      <DefaultItems.ToggleTheme allowSystemTheme={true} theme={systemTheme} />
    {:else}
      <DefaultItems.ToggleTheme allowSystemTheme={false} />
    {/if}
    <DefaultItems.ChangeCanvasBackground />
    <DefaultItems.Preferences />
    <MainMenu.Item data-testid="custom-item">custom</MainMenu.Item>
  </MainMenu>
  <div class="layer-ui-top-left" data-testid="outlet">
    <TunnelOut tunnel={tunnels.MainMenuTunnel} />
  </div>
</div>
