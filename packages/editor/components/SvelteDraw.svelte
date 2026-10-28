<script lang="ts">
  import {
    DEFAULT_IMAGE_OPTIONS,
    DEFAULT_UI_OPTIONS,
  } from "@svelte-draw/common";

  import { defaultLang, languages, setLanguage } from "../i18n";
  import {
    getExcalidrawAPIContext,
    hasExcalidrawAPIContext,
  } from "../ui/apiContext";

  import EditorHost from "./EditorHost.svelte";
  import LoadingMessage from "./LoadingMessage.svelte";

  import type {
    AppProps,
    SvelteDrawAPI,
    SvelteDrawProps,
  } from "../types";

  import "../css/app.scss";
  import "../css/styles.scss";
  import "../fonts/fonts.css";

  let props: SvelteDrawProps = $props();

  const apiContext = hasExcalidrawAPIContext() ? getExcalidrawAPIContext() : null;

  const langCode = $derived(props.langCode ?? defaultLang.code);

  // --- language: nothing renders until the active language is loaded ---------
  let loading = $state(true);

  $effect(() => {
    const code = langCode;
    let cancelled = false;
    const currentLang =
      languages.find((lang) => lang.code === code) || defaultLang;
    setLanguage(currentLang).then(() => {
      if (!cancelled) {
        loading = false;
      }
    });
    return () => {
      cancelled = true;
    };
  });

  // --- props normalization (defaults the editor relies on) -------------------
  const appProps = $derived.by((): AppProps => {
    const canvasActions = props.UIOptions?.canvasActions;

    // FIXME normalize/set defaults in parent component so that the memo resolver
    // compares the same values
    const UIOptions: AppProps["UIOptions"] = {
      ...props.UIOptions,
      canvasActions: {
        ...DEFAULT_UI_OPTIONS.canvasActions,
        ...canvasActions,
      },
      tools: {
        image: props.UIOptions?.tools?.image ?? true,
      },
    };

    if (canvasActions?.export) {
      UIOptions.canvasActions.export.saveFileToDisk =
        canvasActions.export?.saveFileToDisk ??
        DEFAULT_UI_OPTIONS.canvasActions.export.saveFileToDisk;
    }

    if (
      UIOptions.canvasActions.toggleTheme === null &&
      (props.theme == null || props.onThemeChange)
    ) {
      UIOptions.canvasActions.toggleTheme = true;
    }

    const imageOptions: AppProps["imageOptions"] = {
      maxFileSizeBytes:
        props.imageOptions?.maxFileSizeBytes ??
        DEFAULT_IMAGE_OPTIONS.maxFileSizeBytes,
      maxWidthOrHeight:
        props.imageOptions?.maxWidthOrHeight ??
        DEFAULT_IMAGE_OPTIONS.maxWidthOrHeight,
    };

    return {
      onExport: props.onExport,
      className: props.className,
      ownerDocument: props.ownerDocument ?? document,
      renderEnvironment: props.renderEnvironment,
      onChange: props.onChange,
      onThemeChange: props.onThemeChange,
      onIncrement: props.onIncrement,
      initialData: props.initialData,
      initialState: props.initialState,
      onExcalidrawAPI: handleExcalidrawAPI,
      onMount: props.onMount,
      onUnmount: props.onUnmount,
      onInitialize: props.onInitialize,
      isCollaborating: props.isCollaborating ?? false,
      onPointerUpdate: props.onPointerUpdate,
      renderTopLeftUI: props.renderTopLeftUI,
      renderTopRightUI: props.renderTopRightUI,
      langCode,
      viewModeEnabled: props.viewModeEnabled,
      interaction: props.interaction,
      ui: props.ui,
      activeTool: props.activeTool,
      zenModeEnabled: props.zenModeEnabled,
      gridModeEnabled: props.gridModeEnabled,
      libraryReturnUrl: props.libraryReturnUrl,
      theme: props.theme,
      name: props.name,
      renderCustomStats: props.renderCustomStats,
      UIOptions,
      onPaste: props.onPaste,
      detectScroll: props.detectScroll ?? true,
      handleKeyboardGlobally: props.handleKeyboardGlobally ?? false,
      onLibraryChange: props.onLibraryChange,
      autoFocus: props.autoFocus ?? false,
      generateIdForFile: props.generateIdForFile,
      onLinkOpen: props.onLinkOpen,
      generateLinkForSelection: props.generateLinkForSelection,
      onPointerDown: props.onPointerDown,
      onPointerUp: props.onPointerUp,
      onScrollChange: props.onScrollChange,
      onUserFollow: props.onUserFollow,
      userToFollow: props.userToFollow,
      onDuplicate: props.onDuplicate,
      validateEmbeddable: props.validateEmbeddable,
      renderEmbeddable: props.renderEmbeddable,
      aiEnabled: props.aiEnabled !== false,
      showDeprecatedFonts: props.showDeprecatedFonts,
      renderScrollbars: props.renderScrollbars,
      viewportStatusFrame: props.viewportStatusFrame,
      currentUserControls: props.currentUserControls,
      imageOptions,
      children: props.children,
    };
  });

  function handleExcalidrawAPI(api: SvelteDrawAPI | null) {
    apiContext?.set(api);
    props.onExcalidrawAPI?.(api);
  }

  // --- pinch-zoom guard ------------------------------------------------------
  // whether the browser's own zoom is kept available while the editor is
  // non-interactive (with navigation allowed, pinch is consumed by the
  // editor instead, which relies on the pinch prevention below)
  const browserZoomAllowed = $derived(
    typeof props.interaction === "object" &&
      props.interaction !== null &&
      props.interaction.enabled?.browserZoom === true &&
      props.interaction.enabled?.navigation !== true,
  );

  const ownerDocument = $derived(props.ownerDocument ?? document);

  $effect(() => {
    // roundRect polyfill for older browsers
    // @ts-ignore
    void import("canvas-roundrect-polyfill");

    if (browserZoomAllowed) {
      return;
    }

    // Block pinch-zooming on iOS outside of the content area
    const handleTouchMove = (event: TouchEvent) => {
      // @ts-ignore
      if (typeof event.scale === "number" && event.scale !== 1) {
        event.preventDefault();
      }
    };

    const doc = ownerDocument;
    doc.addEventListener("touchmove", handleTouchMove, { passive: false });

    return () => {
      doc.removeEventListener("touchmove", handleTouchMove);
    };
  });
</script>

{#if loading}
  <LoadingMessage theme={props.theme} />
{:else}
  <EditorHost {appProps} children={props.children} />
{/if}
