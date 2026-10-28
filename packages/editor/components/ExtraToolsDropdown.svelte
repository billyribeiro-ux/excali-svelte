<script lang="ts">
  import { deriveStylesPanelMode, KEYS } from "@svelte-draw/common";

  import { getTunnels } from "../context/tunnels";
  import { t } from "../i18n";
  import TunnelOut from "../ui/TunnelOut.svelte";
  import { getEditorContext } from "../ui/editorContext";

  import DropdownMenu from "./dropdownMenu/DropdownMenu.svelte";
  import DropdownMenuContent from "./dropdownMenu/DropdownMenuContent.svelte";
  import DropdownMenuItem from "./dropdownMenu/DropdownMenuItem.svelte";
  import DropdownMenuTrigger from "./dropdownMenu/DropdownMenuTrigger.svelte";
  import DropDownMenuItemBadge from "./dropdownMenu/DropDownMenuItemBadge.svelte";
  import Icon from "./Icon.svelte";
  import {
    bucketFillIcon,
    DotsIcon,
    drawShapeToolIcon,
    EmbedIcon,
    frameToolIcon,
    ImageIcon,
    LassoIcon,
    laserPointerToolIcon,
    MagicIcon,
    mermaidLogoIcon,
  } from "./icons";
  import { getToolShortcut, isToolButtonDisabled } from "./Tools";

  import type { AppClassProperties, AppProps, UIAppState } from "../types";

  let {
    app,
    activeTool,
    UIOptions,
    setAppState: setAppStateProp,
  }: {
    app: AppClassProperties;
    activeTool: UIAppState["activeTool"];
    UIOptions: AppProps["UIOptions"];
    setAppState?: AppClassProperties["setAppState"];
  } = $props();

  const ctx = getEditorContext();
  const tunnels = getTunnels();
  const setAppState = $derived(setAppStateProp ?? ctx.setAppState);

  let isExtraToolsMenuOpen = $state(false);
  const isFullStylesPanel = $derived(
    deriveStylesPanelMode(ctx.editorInterface) === "full",
  );

  const imageToolSelected = $derived(activeTool.type === "image");
  const frameToolSelected = $derived(activeTool.type === "frame");
  const drawShapeToolSelected = $derived(activeTool.type === "autoshape");
  const laserToolSelected = $derived(activeTool.type === "laser");
  const bucketFillToolSelected = $derived(activeTool.type === "bucketfill");
  const lassoToolSelected = $derived(
    isFullStylesPanel &&
      activeTool.type === "lasso" &&
      app.state.preferredSelectionTool.type !== "lasso",
  );
  const embeddableToolSelected = $derived(activeTool.type === "embeddable");

  const triggerIcon = $derived(
    imageToolSelected
      ? ImageIcon
      : frameToolSelected
      ? frameToolIcon
      : embeddableToolSelected
      ? EmbedIcon
      : isFullStylesPanel && drawShapeToolSelected
      ? drawShapeToolIcon
      : laserToolSelected && !app.props.isCollaborating
      ? laserPointerToolIcon
      : lassoToolSelected
      ? LassoIcon
      : bucketFillToolSelected
      ? bucketFillIcon
      : DotsIcon,
  );
</script>

<DropdownMenu open={isExtraToolsMenuOpen}>
  <DropdownMenuTrigger
    class={[
      "App-toolbar__extra-tools-trigger",
      {
        "App-toolbar__extra-tools-trigger--selected":
          imageToolSelected ||
          frameToolSelected ||
          embeddableToolSelected ||
          (isFullStylesPanel && drawShapeToolSelected) ||
          lassoToolSelected ||
          bucketFillToolSelected ||
          // in collab we're already highlighting the laser button
          // outside toolbar, so let's not highlight extra-tools button
          // on top of it
          (laserToolSelected && !app.props.isCollaborating),
      },
    ]}
    onToggle={() => {
      isExtraToolsMenuOpen = !isExtraToolsMenuOpen;
      setAppState({ openMenu: null, openPopup: null });
    }}
    title={t("toolBar.extraTools")}
  >
    <Icon icon={triggerIcon} />
  </DropdownMenuTrigger>
  <DropdownMenuContent
    onClickOutside={() => (isExtraToolsMenuOpen = false)}
    onSelect={() => (isExtraToolsMenuOpen = false)}
    class="App-toolbar__extra-tools-dropdown"
  >
    {#if UIOptions.tools?.image !== false}
      <DropdownMenuItem
        onSelect={() => app.setActiveTool({ type: "image" })}
        icon={ImageIcon}
        shortcut={KEYS["9"]}
        data-testid="toolbar-image"
        selected={imageToolSelected}
        disabled={isToolButtonDisabled(app, "image")}
      >
        {t("toolBar.image")}
      </DropdownMenuItem>
    {/if}
    <DropdownMenuItem
      onSelect={() => app.setActiveTool({ type: "frame" })}
      icon={frameToolIcon}
      shortcut={KEYS.F.toLocaleUpperCase()}
      data-testid="toolbar-frame"
      selected={frameToolSelected}
      disabled={isToolButtonDisabled(app, "frame")}
    >
      {t("toolBar.frame")}
    </DropdownMenuItem>
    <DropdownMenuItem
      onSelect={() => app.setActiveTool({ type: "embeddable" })}
      icon={EmbedIcon}
      data-testid="toolbar-embeddable"
      selected={embeddableToolSelected}
      disabled={isToolButtonDisabled(app, "embeddable")}
    >
      {t("toolBar.embeddable")}
    </DropdownMenuItem>
    <DropdownMenuItem
      onSelect={() => app.setActiveTool({ type: "autoshape" })}
      icon={drawShapeToolIcon}
      shortcut={getToolShortcut("autoshape")}
      data-testid="toolbar-autoshape"
      selected={drawShapeToolSelected}
      disabled={isToolButtonDisabled(app, "autoshape")}
    >
      {t("toolBar.autoshape")}
    </DropdownMenuItem>
    <DropdownMenuItem
      onSelect={() => app.setActiveTool({ type: "laser" })}
      icon={laserPointerToolIcon}
      data-testid="toolbar-laser"
      selected={laserToolSelected}
      shortcut={KEYS.K.toLocaleUpperCase()}
      disabled={isToolButtonDisabled(app, "laser")}
    >
      {t("toolBar.laser")}
    </DropdownMenuItem>
    <DropdownMenuItem
      onSelect={() => app.setActiveTool({ type: "bucketfill" })}
      icon={bucketFillIcon}
      data-testid="toolbar-bucketfill"
      selected={bucketFillToolSelected}
      shortcut={KEYS.B.toLocaleUpperCase()}
      disabled={isToolButtonDisabled(app, "bucketfill")}
    >
      {t("toolBar.bucketfill")}
    </DropdownMenuItem>
    {#if isFullStylesPanel}
      <DropdownMenuItem
        onSelect={() => app.setActiveTool({ type: "lasso" })}
        icon={LassoIcon}
        data-testid="toolbar-lasso"
        selected={lassoToolSelected}
        disabled={isToolButtonDisabled(app, "lasso")}
      >
        {t("toolBar.lasso")}
      </DropdownMenuItem>
    {/if}
    <div style="margin: 6px 0; font-size: 14px; font-weight: 600;">Generate</div>
    {#if app.props.aiEnabled !== false}
      <TunnelOut tunnel={tunnels.TTDDialogTriggerTunnel} />
    {/if}
    <DropdownMenuItem
      onSelect={() => app.setOpenDialog({ name: "ttd", tab: "mermaid" })}
      icon={mermaidLogoIcon}
      data-testid="toolbar-embeddable"
    >
      {t("toolBar.mermaidToExcalidraw")}
    </DropdownMenuItem>
    {#if app.props.aiEnabled !== false && app.plugins.diagramToCode}
      <DropdownMenuItem
        onSelect={() => app.onMagicframeToolSelect()}
        icon={MagicIcon}
        data-testid="toolbar-magicframe"
        disabled={isToolButtonDisabled(app, "magicframe")}
      >
        {#snippet badge()}
          <DropDownMenuItemBadge>AI</DropDownMenuItemBadge>
        {/snippet}
        {t("toolBar.magicframe")}
      </DropdownMenuItem>
    {/if}
  </DropdownMenuContent>
</DropdownMenu>
