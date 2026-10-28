<script lang="ts">
  import { capitalizeString, KEYS } from "@svelte-draw/common";

  import { getTunnels } from "../context/tunnels";
  import { t } from "../i18n";
  import TunnelOut from "../ui/TunnelOut.svelte";
  import { getEditorContext } from "../ui/editorContext";

  import DropdownMenu from "./dropdownMenu/DropdownMenu.svelte";
  import DropdownMenuContent from "./dropdownMenu/DropdownMenuContent.svelte";
  import DropdownMenuItem from "./dropdownMenu/DropdownMenuItem.svelte";
  import DropdownMenuTrigger from "./dropdownMenu/DropdownMenuTrigger.svelte";
  import DropDownMenuItemBadge from "./dropdownMenu/DropDownMenuItemBadge.svelte";
  import EraserToolButton from "./EraserToolButton.svelte";
  import FrameToolButton from "./FrameToolButton.svelte";
  import FreedrawToolPopover from "./FreedrawToolPopover.svelte";
  import HandToolButton from "./HandToolButton.svelte";
  import Icon from "./Icon.svelte";
  import ImageToolButton from "./ImageToolButton.svelte";
  import SelectionToolPopover from "./SelectionToolPopover.svelte";
  import TextToolButton from "./TextToolButton.svelte";
  import ToolPopover from "./ToolPopover.svelte";
  import { getToolShortcut, isToolButtonDisabled, TOOLS } from "./Tools";
  import {
    bucketFillIcon,
    DotsIcon,
    drawShapeToolIcon,
    EmbedIcon,
    frameToolIcon,
    ImageIcon,
    laserPointerToolIcon,
    MagicIcon,
    mermaidLogoIcon,
    stickyNoteToolIcon,
    TextIcon,
  } from "./icons";

  import "./ToolIcon.scss";
  import "./MobileToolbar.scss";

  import type { AppClassProperties } from "../types";

  let {
    app,
    setAppState: setAppStateProp,
  }: {
    app: AppClassProperties;
    /** optional override of the editor context's `setAppState` */
    setAppState?: AppClassProperties["setAppState"];
  } = $props();

  const ctx = getEditorContext();
  const tunnels = getTunnels();
  const setAppState = $derived(setAppStateProp ?? ctx.setAppState);

  const activeTool = $derived(ctx.appState.activeTool);

  let isOtherShapesMenuOpen = $state(false);
  let lastActiveGenericShape = $state<"rectangle" | "diamond" | "ellipse">(
    "rectangle",
  );
  let lastActiveLinearElement = $state<"arrow" | "line">("arrow");

  // keep lastActiveGenericShape in sync with active tool if user switches via other UI
  $effect(() => {
    const type = activeTool.type;
    if (type === "rectangle" || type === "diamond" || type === "ellipse") {
      lastActiveGenericShape = type;
    }
  });

  // keep lastActiveLinearElement in sync with active tool if user switches via other UI
  $effect(() => {
    const type = activeTool.type;
    if (type === "arrow" || type === "line") {
      lastActiveLinearElement = type;
    }
  });

  const frameToolSelected = $derived(activeTool.type === "frame");
  const drawShapeToolSelected = $derived(activeTool.type === "autoshape");
  const laserToolSelected = $derived(activeTool.type === "laser");
  const embeddableToolSelected = $derived(activeTool.type === "embeddable");
  const bucketFillToolSelected = $derived(activeTool.type === "bucketfill");
  const stickyNoteToolSelected = $derived(activeTool.type === "stickynote");

  const SHAPE_TOOLS = $derived(
    (["rectangle", "diamond", "ellipse"] as const).map((type) => ({
      type,
      icon: TOOLS[type].icon,
      title: capitalizeString(t(`toolBar.${type}`)),
      fillable: TOOLS[type].fillable,
    })),
  );

  const LINEAR_ELEMENT_TOOLS = $derived(
    (["arrow", "line"] as const).map((type) => ({
      type,
      icon: TOOLS[type].icon,
      title: capitalizeString(t(`toolBar.${type}`)),
      fillable: TOOLS[type].fillable,
    })),
  );

  let toolbarElement = $state<HTMLDivElement | null>(null);
  let toolbarWidth = $state(0);

  $effect(() => {
    const el = toolbarElement;
    if (!el) {
      return;
    }
    toolbarWidth = el.getBoundingClientRect().width;
    if (typeof ResizeObserver === "undefined") {
      return;
    }
    const observer = new ResizeObserver(() => {
      toolbarWidth = el.getBoundingClientRect().width;
    });
    observer.observe(el);
    return () => observer.disconnect();
  });

  const WIDTH = 36;
  const GAP = 4;

  // hand, selection, freedraw, eraser, rectangle, arrow, others
  const MIN_TOOLS = 7;
  const MIN_WIDTH = MIN_TOOLS * WIDTH + (MIN_TOOLS - 1) * GAP;
  const ADDITIONAL_WIDTH = WIDTH + GAP;

  const showTextToolOutside = $derived(
    toolbarWidth >= MIN_WIDTH + 1 * ADDITIONAL_WIDTH,
  );
  const showImageToolOutside = $derived(
    toolbarWidth >= MIN_WIDTH + 2 * ADDITIONAL_WIDTH,
  );
  const showFrameToolOutside = $derived(
    toolbarWidth >= MIN_WIDTH + 3 * ADDITIONAL_WIDTH,
  );

  const extraTools = $derived<readonly (typeof activeTool.type)[]>(
    (
      [
        "text",
        "stickynote",
        "frame",
        "embeddable",
        "laser",
        "bucketfill",
        "magicframe",
      ] as const
    ).filter((tool) => {
      if (showTextToolOutside && tool === "text") {
        return false;
      }
      if (showFrameToolOutside && tool === "frame") {
        return false;
      }
      return true;
    }),
  );
  const extraToolSelected = $derived(extraTools.includes(activeTool.type));
  const extraIcon = $derived(
    extraToolSelected
      ? activeTool.type === "text"
        ? TextIcon
        : activeTool.type === "image"
        ? ImageIcon
        : activeTool.type === "frame"
        ? frameToolIcon
        : activeTool.type === "stickynote"
        ? stickyNoteToolIcon
        : activeTool.type === "embeddable"
        ? EmbedIcon
        : activeTool.type === "laser"
        ? laserPointerToolIcon
        : activeTool.type === "bucketfill"
        ? bucketFillIcon
        : activeTool.type === "magicframe"
        ? MagicIcon
        : DotsIcon
      : DotsIcon,
  );
</script>

<div class="mobile-toolbar" bind:this={toolbarElement}>
  <!-- Hand Tool -->
  <HandToolButton {app} {activeTool} hideKeyBinding />

  <!-- Selection Tool -->
  <SelectionToolPopover {app} {activeTool} />

  <!-- Free Draw -->
  <FreedrawToolPopover {app} {activeTool} />

  <!-- Eraser -->
  <EraserToolButton {app} {activeTool} hideShortcut />

  <!-- Rectangle/Diamond/Ellipse -->
  <ToolPopover
    {app}
    options={SHAPE_TOOLS}
    {activeTool}
    defaultOption={lastActiveGenericShape}
    data-testid="toolbar-rectangle"
    onToolChange={(type: string) => {
      if (type === "rectangle" || type === "diamond" || type === "ellipse") {
        lastActiveGenericShape = type;
        app.setActiveTool({ type });
      }
    }}
    displayedOption={SHAPE_TOOLS.find(
      (tool) => tool.type === lastActiveGenericShape,
    ) || SHAPE_TOOLS[0]}
  />

  <!-- Arrow/Line -->
  <ToolPopover
    {app}
    options={LINEAR_ELEMENT_TOOLS}
    {activeTool}
    defaultOption={lastActiveLinearElement}
    data-testid="toolbar-arrow"
    onToolChange={(type: string) => {
      if (type === "arrow" || type === "line") {
        lastActiveLinearElement = type;
        app.setActiveTool({ type });
      }
    }}
    displayedOption={LINEAR_ELEMENT_TOOLS.find(
      (tool) => tool.type === lastActiveLinearElement,
    ) || LINEAR_ELEMENT_TOOLS[0]}
  />

  <!-- Text Tool -->
  {#if showTextToolOutside}<TextToolButton {app} {activeTool} hideShortcut />{/if}

  <!-- Image -->
  {#if showImageToolOutside}<ImageToolButton {app} {activeTool} hideShortcut />{/if}

  <!-- Frame Tool -->
  {#if showFrameToolOutside}<FrameToolButton {app} {activeTool} hideShortcut />{/if}

  <!-- Other Shapes -->
  <DropdownMenu open={isOtherShapesMenuOpen}>
    <DropdownMenuTrigger
      class={[
        "App-toolbar__extra-tools-trigger App-toolbar__extra-tools-trigger--mobile",
        {
          "App-toolbar__extra-tools-trigger--selected":
            extraToolSelected || isOtherShapesMenuOpen,
        },
      ]}
      onToggle={() => {
        isOtherShapesMenuOpen = !isOtherShapesMenuOpen;
        setAppState({ openMenu: null, openPopup: null });
      }}
      title={t("toolBar.extraTools")}
      style="width: {WIDTH}px; height: {WIDTH}px; display: flex; align-items: center; justify-content: center;"
    >
      <Icon icon={extraIcon} />
    </DropdownMenuTrigger>
    <DropdownMenuContent
      onClickOutside={() => (isOtherShapesMenuOpen = false)}
      onSelect={() => (isOtherShapesMenuOpen = false)}
      class="App-toolbar__extra-tools-dropdown"
      align="start"
    >
      {#if !showTextToolOutside}
        <DropdownMenuItem
          onSelect={() => app.setActiveTool({ type: "text" })}
          icon={TextIcon}
          shortcut={KEYS.T.toLocaleUpperCase()}
          data-testid="toolbar-text"
          selected={activeTool.type === "text"}
          disabled={isToolButtonDisabled(app, "text")}
        >
          {t("toolBar.text")}
        </DropdownMenuItem>
      {/if}

      {#if !showImageToolOutside}
        <DropdownMenuItem
          onSelect={() => app.setActiveTool({ type: "image" })}
          icon={ImageIcon}
          data-testid="toolbar-image"
          selected={activeTool.type === "image"}
          disabled={isToolButtonDisabled(app, "image")}
        >
          {t("toolBar.image")}
        </DropdownMenuItem>
      {/if}
      <DropdownMenuItem
        onSelect={() => app.setActiveTool({ type: "stickynote" })}
        icon={stickyNoteToolIcon}
        shortcut={KEYS.N.toLocaleUpperCase()}
        data-testid="toolbar-stickynote"
        selected={stickyNoteToolSelected}
        disabled={isToolButtonDisabled(app, "stickynote")}
      >
        {t("toolBar.stickynote")}
      </DropdownMenuItem>

      {#if !showFrameToolOutside}
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
      {/if}
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
</div>
