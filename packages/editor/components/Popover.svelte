<script lang="ts">
  import { on } from "svelte/events";

  import { KEYS, queryFocusableElements } from "@svelte-draw/common";

  import { clamp } from "@svelte-draw/math";

  import { batchedUpdates } from "../editor/Editor";

  import "./Popover.scss";

  import type { Snippet } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import type { ClassValue } from "svelte/elements";

  const POPOVER_CONTAINER_GAP = 10;

  type Props = {
    top?: number;
    left?: number;
    children?: Snippet;
    onCloseRequest?: (event: PointerEvent) => void;
    fitInViewport?: boolean;
    viewportWidth?: number;
    viewportHeight?: number;
    class?: ClassValue;
  };

  let {
    children,
    left,
    top,
    onCloseRequest,
    fitInViewport = false,
    viewportWidth = window.innerWidth,
    viewportHeight = window.innerHeight,
    class: className,
  }: Props = $props();

  // focus management: runs once on mount
  const focusTrap: Attachment<HTMLDivElement> = (container) => {
    const ownerDocument = container.ownerDocument;

    // focus popover only if the caller didn't focus on something else nested
    // within the popover, which should take precedence. Fixes cases
    // like color picker listening to keydown events on containers nested
    // in the popover.
    if (!container.contains(ownerDocument.activeElement)) {
      container.focus();
    }

    // native listener (not a delegated `onkeydown`) so that
    // `stopImmediatePropagation` runs before document-level handlers
    return on(container, "keydown", (event) => {
      if (event.key === KEYS.TAB) {
        const focusableElements = queryFocusableElements(container);
        const { activeElement } = ownerDocument;
        const currentIndex = focusableElements.findIndex(
          (element) => element === activeElement,
        );

        if (activeElement === container) {
          if (event.shiftKey) {
            focusableElements[focusableElements.length - 1]?.focus();
          } else {
            focusableElements[0].focus();
          }
          event.preventDefault();
          event.stopImmediatePropagation();
        } else if (currentIndex === 0 && event.shiftKey) {
          focusableElements[focusableElements.length - 1]?.focus();
          event.preventDefault();
          event.stopImmediatePropagation();
        } else if (
          currentIndex === focusableElements.length - 1 &&
          !event.shiftKey
        ) {
          focusableElements[0]?.focus();
          event.preventDefault();
          event.stopImmediatePropagation();
        }
      }
    });
  };

  let lastInitializedPos: { top: number; left: number } | null = null;

  // ensure the popover doesn't overflow the viewport
  const fitToViewport: Attachment<HTMLDivElement> = (element) => {
    if (fitInViewport && top != null && left != null) {
      const { width, height } = element.getBoundingClientRect();

      // only run once for the same top/left position, otherwise
      // we'd potentically reposition twice (once for viewport overflow)
      // and once for top/left position afterwards
      if (lastInitializedPos?.top === top && lastInitializedPos?.left === left) {
        return;
      }
      lastInitializedPos = { top, left };

      const maxWidth = Math.max(0, viewportWidth - POPOVER_CONTAINER_GAP * 2);
      if (width >= maxWidth) {
        element.style.width = `${maxWidth}px`;
        element.style.left = `${POPOVER_CONTAINER_GAP}px`;
        element.style.overflowX = "scroll";
      } else {
        element.style.left = `${clamp(
          left,
          POPOVER_CONTAINER_GAP,
          viewportWidth - POPOVER_CONTAINER_GAP - width,
        )}px`;
      }

      const maxHeight = Math.max(0, viewportHeight - POPOVER_CONTAINER_GAP * 2);
      if (height >= maxHeight) {
        element.style.height = `${maxHeight}px`;
        element.style.top = `${POPOVER_CONTAINER_GAP}px`;
        element.style.overflowY = "scroll";
      } else {
        element.style.top = `${clamp(
          top,
          POPOVER_CONTAINER_GAP,
          viewportHeight - POPOVER_CONTAINER_GAP - height,
        )}px`;
      }
    }
  };

  const closeOnOutsidePointerDown: Attachment<HTMLDivElement> = (element) => {
    if (!onCloseRequest) {
      return;
    }
    const handler = (event: PointerEvent) => {
      if (!element.contains(event.target as Node)) {
        batchedUpdates(() => onCloseRequest(event));
      }
    };
    return on(element.ownerDocument, "pointerdown", handler);
  };
</script>

<div
  class={["popover", className]}
  tabindex="-1"
  {@attach fitToViewport}
  {@attach focusTrap}
  {@attach closeOnOutsidePointerDown}
>
  {@render children?.()}
</div>
