<script lang="ts">
  import { createTunnels, setTunnels } from "../../context/tunnels";
  import { setEditorContext } from "../../ui/editorContext";
  import WelcomeScreen from "../welcome-screen/WelcomeScreen";

  import Footer from "./Footer.svelte";
  import FooterCenter from "./FooterCenter.svelte";

  import type { EditorContextValue } from "../../ui/editorContext";

  let {
    ctx,
    defaultUIEnabled = true,
    zoomUIEnabled = true,
    renderWelcomeScreen = false,
    showExitZenModeBtn = false,
    hostCenter = false,
  }: {
    ctx: EditorContextValue;
    defaultUIEnabled?: boolean;
    zoomUIEnabled?: boolean;
    renderWelcomeScreen?: boolean;
    showExitZenModeBtn?: boolean;
    hostCenter?: boolean;
  } = $props();

  const tunnels = createTunnels();
  setTunnels(tunnels);
  // svelte-ignore state_referenced_locally
  setEditorContext(ctx);
</script>

<div class="excalidraw-container">
  {#if hostCenter}
    <FooterCenter><span id="host-footer">host footer</span></FooterCenter>
  {/if}
  {#if renderWelcomeScreen}
    <WelcomeScreen.Hints.HelpHint>help hint</WelcomeScreen.Hints.HelpHint>
  {/if}
  <Footer
    appState={ctx.appState}
    actionManager={ctx.actionManager}
    {showExitZenModeBtn}
    {renderWelcomeScreen}
    {defaultUIEnabled}
    {zoomUIEnabled}
  />
</div>
