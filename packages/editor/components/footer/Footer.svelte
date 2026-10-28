<script lang="ts">
  import { actionShortcuts } from "../../actions";
  import { getTunnels } from "../../context/tunnels";
  import { getEditorContext } from "../../ui/editorContext";
  import TunnelOut from "../../ui/TunnelOut.svelte";
  import ExitZenModeButton from "../ExitZenModeButton.svelte";
  import HelpButton from "../HelpButton.svelte";
  import Section from "../Section.svelte";
  import StackCol from "../StackCol.svelte";
  import UndoRedoActions from "../UndoRedoActions.svelte";
  import ZoomActions from "../ZoomActions.svelte";

  import type { ActionManager } from "../../actions/manager";
  import type { UIAppState } from "../../types";

  type Props = {
    appState: UIAppState;
    actionManager: ActionManager;
    showExitZenModeBtn: boolean;
    renderWelcomeScreen: boolean;
    defaultUIEnabled: boolean;
    zoomUIEnabled: boolean;
  };

  let {
    appState,
    actionManager,
    showExitZenModeBtn,
    renderWelcomeScreen,
    defaultUIEnabled,
    zoomUIEnabled,
  }: Props = $props();

  const tunnels = getTunnels();
  const ctx = getEditorContext();

  const showZoom = $derived(zoomUIEnabled && ctx.app.isNavigationEnabled());
</script>

<!-- svelte-ignore a11y_no_redundant_roles -->
<footer
  role="contentinfo"
  class="layer-ui__wrapper__footer App-menu App-menu_bottom"
>
  <!-- footer-left is not faded out in zen mode: it holds the zoom controls,
       which stay visible (chrome-less). Its children opt in individually. -->
  {#if defaultUIEnabled || showZoom}
    <div class="layer-ui__wrapper__footer-left zen-mode-transition">
      <StackCol gap={2}>
        <Section heading="canvasActions">
          {#if showZoom}
            <ZoomActions />
          {/if}

          {#if defaultUIEnabled && !appState.viewModeEnabled}
            <UndoRedoActions
              class={[
                "zen-mode-transition",
                appState.zenModeEnabled &&
                  "layer-ui__wrapper__footer-left--transition-bottom",
              ]
                .filter(Boolean)
                .join(" ")}
            />
          {/if}
        </Section>
      </StackCol>
    </div>
  {/if}
  <TunnelOut tunnel={tunnels.FooterCenterTunnel} />
  {#if defaultUIEnabled || renderWelcomeScreen}
    <div
      class={[
        "layer-ui__wrapper__footer-right zen-mode-transition",
        { "transition-right": appState.zenModeEnabled },
      ]}
    >
      <div style="position: relative;">
        {#if renderWelcomeScreen}
          <TunnelOut tunnel={tunnels.WelcomeScreenHelpHintTunnel} />
        {/if}
        {#if defaultUIEnabled}
          <HelpButton
            onclick={() => actionManager.executeAction(actionShortcuts)}
          />
        {/if}
      </div>
    </div>
  {/if}
  {#if defaultUIEnabled}
    <ExitZenModeButton {actionManager} {showExitZenModeBtn} />
  {/if}
</footer>
