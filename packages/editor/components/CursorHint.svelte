<script lang="ts">
  import { onDestroy } from "svelte";

  import { EVENT } from "@svelte-draw/common";

  import { cursorHintAtom } from "./CursorHint";
  import Icon from "./Icon.svelte";
  import { positionElementBesideCursor } from "./positionElementBesideCursor";
  import { editorJotaiStore } from "../editor-jotai";
  import { getEditorContext } from "../ui/editorContext";

  import "./CursorHint.scss";

  /** how long the hint stays visible before it starts fading out */
  const CURSOR_HINT_DURATION = 700;
  /** fade-out duration (keep in sync with CursorHint.scss) */
  const CURSOR_HINT_FADE_DURATION = 100;
  /** distance from the pointer so the hint isn't covered by the cursor */
  const CURSOR_HINT_GAP = 16;

  const ctx = getEditorContext();

  const hint = $derived(editorJotaiStore.get(cursorHintAtom));
  const nonce = $derived(hint?.nonce);

  let isFadingOut = $state(false);

  const hideHint = () => {
    editorJotaiStore.set(cursorHintAtom, null);
  };

  // positioning (the element is mounted by the time attachments run)
  const position = (element: HTMLDivElement) => {
    const container = ctx.container;
    const app = ctx.app;
    const ownerWindow = app.ownerWindow;
    if (!container) {
      return;
    }

    const updatePosition = (clientX: number, clientY: number) => {
      const { left, top } = positionElementBesideCursor({
        cursor: { x: clientX, y: clientY },
        element: {
          width: element.offsetWidth,
          height: element.offsetHeight,
        },
        container: container.getBoundingClientRect(),
        gap: CURSOR_HINT_GAP,
      });

      element.style.transform = `translate(${left}px, ${top}px)`;
    };

    updatePosition(app.viewport.lastPosition.x, app.viewport.lastPosition.y);

    const onPointerMove = (event: PointerEvent) => {
      updatePosition(event.clientX, event.clientY);
    };

    ownerWindow.addEventListener(EVENT.POINTER_MOVE, onPointerMove);
    return () => {
      ownerWindow.removeEventListener(EVENT.POINTER_MOVE, onPointerMove);
    };
  };

  // hints are transient — don't let a stale one reappear on remount
  onDestroy(hideHint);

  // fade / hide timers, restarted by every new trigger (nonce)
  $effect(() => {
    if (nonce == null) {
      return;
    }
    const ownerWindow = ctx.app.ownerWindow;

    isFadingOut = false;

    const fadeTimer = ownerWindow.setTimeout(() => {
      isFadingOut = true;
    }, CURSOR_HINT_DURATION);
    const hideTimer = ownerWindow.setTimeout(
      hideHint,
      CURSOR_HINT_DURATION + CURSOR_HINT_FADE_DURATION,
    );

    // hide immediately when the user starts interacting (e.g. drawing)
    // so the hint doesn't get in the way
    ownerWindow.addEventListener(EVENT.POINTER_DOWN, hideHint, {
      capture: true,
    });

    return () => {
      ownerWindow.clearTimeout(fadeTimer);
      ownerWindow.clearTimeout(hideTimer);
      ownerWindow.removeEventListener(EVENT.POINTER_DOWN, hideHint, {
        capture: true,
      });
    };
  });
</script>

{#if hint}
  {#key hint.nonce}
    <div
      class={["CursorHint", { "CursorHint--fade-out": isFadingOut }]}
      data-testid="cursor-hint"
      {@attach position}
    >
      <Icon icon={hint.content} />
    </div>
  {/key}
{/if}
