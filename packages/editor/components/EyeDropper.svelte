<script lang="ts">
  import {
    EVENT,
    isColorDark,
    KEYS,
    THEME,
    removeDarkModeFilter,
    rgbToHex,
  } from "@svelte-draw/common";

  import { getSelectedElements } from "../scene";
  import { getEditorContext } from "../ui/editorContext";

  import { eyeDropperCursor, type EyeDropperProperties } from "./EyeDropper";
  import { positionElementBesideCursor } from "./positionElementBesideCursor";

  import type { ExcalidrawElement } from "@svelte-draw/element/types";

  import "./EyeDropper.scss";

  type Props = {
    onCancel: () => void;
    onSelect: EyeDropperProperties["onSelect"];
    /** called when color changes, on pointerdown for preview */
    onChange: (
      type: EyeDropperProperties["colorPickerType"],
      color: string,
      selectedElements: ExcalidrawElement[],
      event: { altKey: boolean },
    ) => void;
    colorPickerType: EyeDropperProperties["colorPickerType"];
  };

  let { onCancel, onChange, onSelect, colorPickerType }: Props = $props();

  const ctx = getEditorContext();

  let eyeDropperContainer = $state<HTMLDivElement | null>(null);
  let previewEl = $state<HTMLDivElement | null>(null);

  // scalar deriveds so the main effect only re-runs when these change
  const offsetLeft = $derived(ctx.appState.offsetLeft);
  const offsetTop = $derived(ctx.appState.offsetTop);
  const theme = $derived(ctx.appState.theme);

  const selectedElements = $derived(
    getSelectedElements(ctx.elements, ctx.appState),
  );

  // portal container (replaces `useCreatePortalContainer`)
  $effect(() => {
    const excalidrawContainer = ctx.container;
    const ownerDocument = excalidrawContainer?.ownerDocument;
    const parent = excalidrawContainer?.querySelector(
      ".excalidraw-eye-dropper-container",
    );
    if (!parent || !ownerDocument) {
      return;
    }
    const div = ownerDocument.createElement("div");
    parent.appendChild(div);
    eyeDropperContainer = div;
    return () => {
      eyeDropperContainer = null;
      parent.removeChild(div);
    };
  });

  // container classes follow theme / form factor
  $effect(() => {
    const div = eyeDropperContainer;
    if (!div) {
      return;
    }
    div.className = "";
    div.classList.add("excalidraw", "excalidraw-eye-dropper-backdrop");
    div.classList.toggle(
      "excalidraw--mobile",
      ctx.editorInterface.formFactor === "phone",
    );
    div.classList.toggle("theme--dark", ctx.appState.theme === THEME.DARK);
  });

  $effect(() => {
    const div = eyeDropperContainer;
    if (!div) {
      return;
    }
    div.style.cursor = eyeDropperCursor;
    return () => {
      div.style.cursor = "";
    };
  });

  // moves the preview into the portal container
  const portalInto = (target: HTMLElement) => (node: HTMLElement) => {
    target.appendChild(node);
    return () => {
      node.remove();
    };
  };

  $effect(() => {
    const colorPreviewDiv = previewEl;
    const app = ctx.app;
    const ownerWindow = app.ownerWindow;
    const container = eyeDropperContainer;
    const excalidrawContainer = ctx.container;

    if (!colorPreviewDiv || !app.canvas || !container) {
      return;
    }

    let isHoldingPointerDown = false;

    const canvasCtx = app.canvas.getContext("2d")!;

    const getCurrentColor = ({
      clientX,
      clientY,
    }: {
      clientX: number;
      clientY: number;
    }) => {
      const pixel = canvasCtx.getImageData(
        (clientX - offsetLeft) * ownerWindow.devicePixelRatio,
        (clientY - offsetTop) * ownerWindow.devicePixelRatio,
        1,
        1,
      ).data;

      return rgbToHex(pixel[0], pixel[1], pixel[2]);
    };

    const getColorToApply = (color: string) =>
      theme === THEME.DARK ? removeDarkModeFilter(color) : color;

    const mouseMoveListener = ({
      clientX,
      clientY,
      altKey,
    }: {
      clientX: number;
      clientY: number;
      altKey: boolean;
    }) => {
      const { top, left } = positionElementBesideCursor({
        cursor: { x: clientX, y: clientY },
        element: {
          width: colorPreviewDiv.offsetWidth,
          height: colorPreviewDiv.offsetHeight,
        },
        container: container.getBoundingClientRect(),
        gap: 7,
      });

      colorPreviewDiv.style.top = `${top}px`;
      colorPreviewDiv.style.left = `${left}px`;

      const currentColor = getCurrentColor({ clientX, clientY });

      if (isHoldingPointerDown) {
        onChange(
          colorPickerType,
          getColorToApply(currentColor),
          selectedElements,
          { altKey },
        );
      }

      colorPreviewDiv.style.background = currentColor;
      colorPreviewDiv.style.setProperty(
        "--eye-dropper-preview-border-color",
        isColorDark(currentColor) ? "#fff" : "#222",
      );
    };

    const cancel = () => {
      onCancel();
    };

    const pointerDownListener = (event: PointerEvent) => {
      isHoldingPointerDown = true;
      // NOTE we can't event.preventDefault() as that would stop
      // pointermove events
      event.stopImmediatePropagation();
    };

    const pointerUpListener = (event: PointerEvent) => {
      isHoldingPointerDown = false;

      // since we're not preventing default on pointerdown, the focus would
      // goes back to `body` so we want to refocus the editor container instead
      excalidrawContainer?.focus();

      event.stopImmediatePropagation();
      event.preventDefault();

      onSelect(getColorToApply(getCurrentColor(event)), event);
    };

    const keyDownListener = (event: KeyboardEvent) => {
      if (event.key === KEYS.ESCAPE) {
        event.preventDefault();
        event.stopImmediatePropagation();
        cancel();
      }
    };

    // -------------------------------------------------------------------------

    container.tabIndex = -1;
    // focus container so we can listen on keydown events
    container.focus();

    // init color preview else it would show only after the first mouse move
    mouseMoveListener({
      clientX: app.viewport.lastPosition.x,
      clientY: app.viewport.lastPosition.y,
      altKey: false,
    });

    container.addEventListener(EVENT.KEYDOWN, keyDownListener);
    container.addEventListener(EVENT.POINTER_DOWN, pointerDownListener);
    container.addEventListener(EVENT.POINTER_UP, pointerUpListener);
    ownerWindow.addEventListener("pointermove", mouseMoveListener, {
      passive: true,
    });
    ownerWindow.addEventListener(EVENT.BLUR, cancel);

    return () => {
      isHoldingPointerDown = false;
      container.removeEventListener(EVENT.KEYDOWN, keyDownListener);
      container.removeEventListener(EVENT.POINTER_DOWN, pointerDownListener);
      container.removeEventListener(EVENT.POINTER_UP, pointerUpListener);
      ownerWindow.removeEventListener("pointermove", mouseMoveListener);
      ownerWindow.removeEventListener(EVENT.BLUR, cancel);
    };
  });

  // outside click (replaces `useOutsideClick`): anything except the eye
  // dropper trigger / backdrop cancels
  $effect(() => {
    const ownerDocument = previewEl?.ownerDocument;
    if (!ownerDocument) {
      return;
    }

    const onOutsideClick = (event: Event) => {
      const target = event.target as Element | null;
      if (!previewEl || !target) {
        return;
      }
      if (
        target.closest?.(
          ".excalidraw-eye-dropper-trigger, .excalidraw-eye-dropper-backdrop",
        )
      ) {
        return;
      }
      onCancel();
    };

    ownerDocument.addEventListener(EVENT.POINTER_DOWN, onOutsideClick);
    ownerDocument.addEventListener(EVENT.TOUCH_START, onOutsideClick);
    return () => {
      ownerDocument.removeEventListener(EVENT.POINTER_DOWN, onOutsideClick);
      ownerDocument.removeEventListener(EVENT.TOUCH_START, onOutsideClick);
    };
  });
</script>

{#if eyeDropperContainer}
  <div
    bind:this={previewEl}
    class="excalidraw-eye-dropper-preview"
    {@attach portalInto(eyeDropperContainer)}
  ></div>
{/if}
