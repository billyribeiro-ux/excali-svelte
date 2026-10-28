<script lang="ts">
  import { createTunnels, setTunnels } from "../../context/tunnels";
  import { setEditorContext } from "../../ui/editorContext";
  import TunnelOut from "../../ui/TunnelOut.svelte";

  import WelcomeScreen from "./WelcomeScreen";

  import type { EditorContextValue } from "../../ui/editorContext";

  let {
    ctx,
    custom = false,
    onLiveCollab,
  }: {
    ctx: EditorContextValue;
    custom?: boolean;
    onLiveCollab?: () => void;
  } = $props();

  const tunnels = createTunnels();
  setTunnels(tunnels);
  // svelte-ignore state_referenced_locally
  setEditorContext(ctx);
</script>

<div class="excalidraw-container">
  {#if custom}
    <WelcomeScreen>
      <WelcomeScreen.Center>
        <WelcomeScreen.Center.Logo>my logo</WelcomeScreen.Center.Logo>
        <WelcomeScreen.Center.Heading>my heading</WelcomeScreen.Center.Heading>
        <WelcomeScreen.Center.Menu>
          <WelcomeScreen.Center.MenuItemLoadScene />
          <WelcomeScreen.Center.MenuItemHelp />
          <WelcomeScreen.Center.MenuItemLink href="https://example.com">
            a link
          </WelcomeScreen.Center.MenuItemLink>
          <WelcomeScreen.Center.MenuItemLiveCollaborationTrigger
            onSelect={() => onLiveCollab?.()}
          />
        </WelcomeScreen.Center.Menu>
      </WelcomeScreen.Center>
      <WelcomeScreen.Hints.MenuHint>my menu hint</WelcomeScreen.Hints.MenuHint>
      <WelcomeScreen.Hints.ToolbarHint>my toolbar hint</WelcomeScreen.Hints.ToolbarHint>
      <WelcomeScreen.Hints.HelpHint>my help hint</WelcomeScreen.Hints.HelpHint>
    </WelcomeScreen>
  {:else}
    <WelcomeScreen />
  {/if}
  <div data-testid="menu-hint-out"><TunnelOut tunnel={tunnels.WelcomeScreenMenuHintTunnel} /></div>
  <div data-testid="toolbar-hint-out"><TunnelOut tunnel={tunnels.WelcomeScreenToolbarHintTunnel} /></div>
  <div data-testid="help-hint-out"><TunnelOut tunnel={tunnels.WelcomeScreenHelpHintTunnel} /></div>
  <div data-testid="center-out"><TunnelOut tunnel={tunnels.WelcomeScreenCenterTunnel} /></div>
</div>
