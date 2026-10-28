<script lang="ts">
  import type { Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";

  import { getEditorContext } from "../ui/editorContext";
  import { getTunnels } from "../context/tunnels";
  import { t } from "../i18n";
  import { getScrollToContentState } from "../scene";
  import { SCROLLBAR_WIDTH, SCROLLBAR_MARGIN } from "../scene/scrollbars";
  import TunnelOut from "../ui/TunnelOut.svelte";

  import ExitViewModeButton from "./ExitViewModeButton.svelte";
  import MobileShapeActions from "./MobileShapeActions.svelte";
  import MobileToolbar from "./MobileToolbar.svelte";
  import FixedSideContainer from "./FixedSideContainer.svelte";
  import Island from "./Island.svelte";
  import PenModeButton from "./PenModeButton.svelte";
  import ViewportStatusBadge from "./ViewportStatusFrame/ViewportStatusBadge.svelte";

  import type { AppClassProperties, UIAppState } from "../types";

  type Props = {
    onPenModeToggle: AppClassProperties["togglePenMode"];
    /** React returned a JSX element; here a snippet receiving `(isMobile, appState)` */
    renderTopRightUI?: Snippet<[boolean, UIAppState]>;
    renderTopLeftUI?: Snippet<[boolean, UIAppState]>;
    renderSidebars: Snippet;
    renderWelcomeScreen: boolean;
    defaultUIEnabled: boolean;
    scrollBackToContentUIEnabled: boolean;
  };

  let {
    onPenModeToggle,
    renderTopRightUI,
    renderTopLeftUI,
    renderSidebars,
    renderWelcomeScreen,
    defaultUIEnabled,
    scrollBackToContentUIEnabled,
  }: Props = $props();

  // React: `renderTopRightUI?.(true, appState) ?? defaults`. A snippet can't
  // return null, so a snippet that renders nothing counts as "no override"
  let customTopRightEmpty = $state(true);

  const watchTopRightEmpty: Attachment<HTMLElement> = (element) => {
    const update = () => {
      customTopRightEmpty =
        element.childElementCount === 0 && !element.textContent?.trim();
    };
    update();
    const observer = new MutationObserver(update);
    observer.observe(element, {
      childList: true,
      subtree: true,
      characterData: true,
    });
    return () => observer.disconnect();
  };

  const ctx = getEditorContext();
  const tunnels = getTunnels();

  const app = $derived(ctx.app);
  const appState = $derived(ctx.appState);
  const elementsMap = $derived.by(() => {
    void ctx.elements;
    return ctx.app.scene.getNonDeletedElementsMap();
  });

  const shouldRenderScrollBackToContent = $derived(
    scrollBackToContentUIEnabled && appState.scrolledOutside,
  );
  const shouldRenderDefaultBottomBar = $derived(
    defaultUIEnabled && !appState.viewModeEnabled,
  );
  const showScrollBackButton = $derived(
    shouldRenderScrollBackToContent &&
      !appState.openMenu &&
      !appState.openSidebar,
  );
  const viewportStatusFrame = $derived(app.props.viewportStatusFrame);
</script>

{#snippet scrollBackToContentButton()}
  <button
    type="button"
    class="scroll-back-to-content"
    onclick={() => {
      ctx.setAppState((appState) => ({
        ...getScrollToContentState(ctx.elements, appState),
      }));
    }}
  >
    {t("buttons.scrollBackToContent")}
  </button>
{/snippet}

{@render renderSidebars()}
<!-- welcome screen, bottom bar, and top bar all have the same z-index -->
<!-- ordered in this reverse order so that top bar is on top -->
<div class="App-welcome-screen">
  {#if renderWelcomeScreen}
    <TunnelOut tunnel={tunnels.WelcomeScreenCenterTunnel} />
  {/if}
</div>

{#if shouldRenderDefaultBottomBar}
  <div
    class="App-bottom-bar"
    style:margin-bottom="{SCROLLBAR_WIDTH + SCROLLBAR_MARGIN}px"
    data-viewport-ui="bottom"
  >
    {#if showScrollBackButton}
      <div class="floating-status-stack">
        {@render scrollBackToContentButton()}
      </div>
    {/if}

    <MobileShapeActions
      {appState}
      {elementsMap}
      {app}
    />

    <Island class="App-toolbar">
      {#if appState.openDialog?.name !== "elementLinkSelector"}
        <MobileToolbar {app} setAppState={ctx.setAppState} />
      {/if}
    </Island>
  </div>
{/if}

{#if !shouldRenderDefaultBottomBar && showScrollBackButton}
  <div class="floating-status-stack">
    {@render scrollBackToContentButton()}
  </div>
{/if}

{#if viewportStatusFrame?.label}
  <div class="viewport-status-frame__badge-row">
    <ViewportStatusBadge
      label={viewportStatusFrame.label}
      border={viewportStatusFrame.border}
    />
  </div>
{/if}

<FixedSideContainer side="top" class="App-top-bar">
  {#if appState.openDialog?.name !== "elementLinkSelector"}
    <div
      class="App-toolbar-content"
      style="display: flex; flex-direction: row; justify-content: space-between;"
    >
      <div class="excalidraw-ui-top-left">
        {@render renderTopLeftUI?.(true, appState)}
        <TunnelOut tunnel={tunnels.MainMenuTunnel} />
      </div>
      <div class="excalidraw-ui-top-right">
        {#if renderTopRightUI}
          <div style="display: contents" {@attach watchTopRightEmpty}>
            {@render renderTopRightUI(true, appState)}
          </div>
        {/if}
        {#if (!renderTopRightUI || customTopRightEmpty) && !appState.viewModeEnabled}
          {#if defaultUIEnabled}
            <PenModeButton
              checked={appState.penMode}
              onChange={() => onPenModeToggle(null)}
              title={t("toolBar.penMode")}
              isMobile
              penDetected={appState.penDetected}
            />
          {/if}
          <TunnelOut tunnel={tunnels.DefaultSidebarTriggerTunnel} />
        {/if}
        {#if defaultUIEnabled && appState.viewModeEnabled && app.isInteractionEnabled()}
          <ExitViewModeButton actionManager={ctx.actionManager} />
        {/if}
      </div>
    </div>
  {/if}
</FixedSideContainer>
