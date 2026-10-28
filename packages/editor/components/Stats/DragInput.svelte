<script lang="ts" generics="T extends StatsInputProperty, E extends ExcalidrawElement = ExcalidrawElement">
  import { untrack } from "svelte";

  import { EVENT, KEYS, cloneJSON } from "@svelte-draw/common";

  import { deepCopyElement } from "@svelte-draw/element";

  import { CaptureUpdateAction } from "@svelte-draw/element";

  import type {
    ElementsMap,
    ExcalidrawElement,
  } from "@svelte-draw/element/types";

  import type { Scene } from "@svelte-draw/element";

  import { getEditorContext } from "../../ui/editorContext";
  import InlineIcon from "../InlineIcon.svelte";

  import { SMALLEST_DELTA } from "./utils";

  import "./DragInput.scss";

  import type { IconDef } from "../icons";
  import type {
    DragFinishedCallbackType,
    DragInputCallbackType,
  } from "./DragInput";
  import type { StatsInputProperty } from "./utils";
  import type { AppState } from "../../types";

  type Props = {
    label: string;
    icon?: IconDef;
    value: number | "Mixed";
    elements: readonly E[];
    editable?: boolean;
    shouldKeepAspectRatio?: boolean;
    dragInputCallback: DragInputCallbackType<T, E>;
    property: T;
    scene: Scene;
    appState: AppState;
    /** how many px you need to drag to get 1 unit change */
    sensitivity?: number;
    dragFinishedCallback?: DragFinishedCallbackType;
  };

  let {
    label,
    icon,
    dragInputCallback,
    value,
    elements,
    editable = true,
    shouldKeepAspectRatio,
    property,
    scene,
    appState,
    sensitivity = 1,
    dragFinishedCallback,
  }: Props = $props();

  const ctx = getEditorContext();
  const app = ctx.app;
  const ownerDocument = app.ownerDocument;
  const ownerWindow = app.ownerWindow;
  const setAppState = ctx.setAppState;

  let inputEl = $state<HTMLInputElement | null>(null);
  let labelEl = $state<HTMLDivElement | null>(null);

  // follows `value`, locally overridden while typing
  let inputValue = $derived(value.toString());

  // non-reactive bookkeeping (what `useRef` held)
  const gesture = {
    originalAppState: untrack(() => cloneJSON(appState)) as AppState,
    originalElements: untrack(() => elements) as readonly E[],
    updatePending: false,
  };

  const callbacks: {
    onPointerUp?: (event: PointerEvent) => void;
    onPointerMove?: (event: PointerEvent) => void;
  } = {};

  const handleInputValue = (
    updatedValue: string,
    elements: readonly E[],
    appState: AppState,
  ) => {
    if (!gesture.updatePending) {
      return false;
    }
    gesture.updatePending = false;

    const parsed = Number(updatedValue);
    // Number.isFinite also rejects "Infinity"/"1e999", which `isNaN` lets
    // through — non-finite values corrupt element geometry (NaN/Infinity
    // don't survive the JSON round-trip on save)
    if (!Number.isFinite(parsed)) {
      inputValue = value.toString();
      return;
    }

    const rounded = Number(parsed.toFixed(2));
    const original = Number(value);

    // only update when
    // 1. original was "Mixed" and we have a new value
    // 2. original was not "Mixed" and the difference between a new value and previous value is greater
    //    than the smallest delta allowed, which is 0.01
    // reason: idempotent to avoid unnecessary
    if (isNaN(original) || Math.abs(rounded - original) >= SMALLEST_DELTA) {
      // a real snapshot (copies), like the pointer-drag path builds: the
      // callbacks derive gesture-start values from it — e.g. a sticky note's
      // width and its label's font ceiling — and the live map would already
      // carry the change they apply. A typed value is applied once, so the
      // scene at this point still is the original.
      const originalElementsMap: ElementsMap = new Map();
      for (const element of app.scene.getNonDeletedElements()) {
        originalElementsMap.set(element.id, deepCopyElement(element));
      }
      dragInputCallback({
        accumulatedChange: 0,
        instantChange: 0,
        originalElements: elements,
        originalElementsMap,
        shouldKeepAspectRatio: !!shouldKeepAspectRatio,
        shouldChangeByStepSize: false,
        scene,
        nextValue: rounded,
        property,
        originalAppState: appState,
        setInputValue: (value) => {
          inputValue = String(value);
        },
        app,
        setAppState,
      });
      app.syncActionResult({
        captureUpdate: CaptureUpdateAction.IMMEDIATELY,
      });
    }
  };

  // make sure that clicking on canvas (which unmounts the input) updates the
  // current input value (blur isn't triggered). The input only exists while
  // `editable`, so a change of `editable` is also a mount/unmount (browsers
  // don't blur an input that gets disabled).
  const trackInput = (input: HTMLInputElement) => {
    return () => {
      const nextValue = input.value;
      if (nextValue) {
        handleInputValue(
          nextValue,
          gesture.originalElements,
          gesture.originalAppState,
        );
      }

      // generally not needed, but in case `pointerup` doesn't fire and
      // we don't remove the listeners that way, we should at least remove
      // on unmount
      if (callbacks.onPointerMove) {
        ownerWindow.removeEventListener(
          EVENT.POINTER_MOVE,
          callbacks.onPointerMove,
          false,
        );
      }
      if (callbacks.onPointerUp) {
        ownerWindow.removeEventListener(
          EVENT.POINTER_UP,
          callbacks.onPointerUp,
          false,
        );
      }
    };
  };

  const onLabelPointerDown = () => {
    if (inputEl && editable) {
      ownerDocument.body.classList.add("excalidraw-cursor-resize");

      let startValue = Number(inputEl.value);
      if (isNaN(startValue)) {
        startValue = 0;
      }

      let lastPointer: {
        x: number;
        y: number;
      } | null = null;

      let originalElementsMap: ElementsMap | null = app.scene
        .getNonDeletedElements()
        .reduce((acc: ElementsMap, element) => {
          acc.set(element.id, deepCopyElement(element));
          return acc;
        }, new Map());

      let originalElements: readonly E[] | null = elements.map(
        (element) => originalElementsMap!.get(element.id) as E,
      );

      const originalAppState: AppState = cloneJSON(appState);

      let accumulatedChange = 0;
      let stepChange = 0;

      const onPointerMove = (event: PointerEvent) => {
        if (
          lastPointer &&
          originalElementsMap !== null &&
          originalElements !== null
        ) {
          const instantChange = event.clientX - lastPointer.x;

          if (instantChange !== 0) {
            stepChange += instantChange;

            if (Math.abs(stepChange) >= sensitivity) {
              stepChange =
                Math.sign(stepChange) *
                Math.floor(Math.abs(stepChange) / sensitivity);

              accumulatedChange += stepChange;

              dragInputCallback({
                accumulatedChange,
                instantChange: stepChange,
                originalElements,
                originalElementsMap,
                shouldKeepAspectRatio: !!shouldKeepAspectRatio,
                shouldChangeByStepSize: event.shiftKey,
                property,
                scene,
                originalAppState,
                setInputValue: (value) => {
                  inputValue = String(value);
                },
                app,
                setAppState,
              });

              stepChange = 0;
            }
          }
        }

        lastPointer = {
          x: event.clientX,
          y: event.clientY,
        };
      };

      const onPointerUp = () => {
        ownerWindow.removeEventListener(
          EVENT.POINTER_MOVE,
          onPointerMove,
          false,
        );

        app.syncActionResult({
          captureUpdate: CaptureUpdateAction.IMMEDIATELY,
        });

        // Notify implementors
        dragFinishedCallback?.({
          app,
          setAppState,
          originalElements,
          originalAppState,
        });

        lastPointer = null;
        accumulatedChange = 0;
        stepChange = 0;
        originalElements = null;
        originalElementsMap = null;

        ownerDocument.body.classList.remove("excalidraw-cursor-resize");

        ownerWindow.removeEventListener(EVENT.POINTER_UP, onPointerUp, false);
      };

      callbacks.onPointerMove = onPointerMove;
      callbacks.onPointerUp = onPointerUp;

      ownerWindow.addEventListener(EVENT.POINTER_MOVE, onPointerMove, false);
      ownerWindow.addEventListener(EVENT.POINTER_UP, onPointerUp, false);
    }
  };

  const onLabelPointerEnter = () => {
    if (labelEl) {
      labelEl.style.cursor = "ew-resize";
    }
  };

  const onKeyDown = (event: KeyboardEvent & { currentTarget: HTMLInputElement }) => {
    if (editable) {
      const eventTarget = event.currentTarget;
      if (
        eventTarget instanceof ownerWindow.HTMLInputElement &&
        event.key === KEYS.ENTER
      ) {
        handleInputValue(eventTarget.value, elements, appState);
        app.focusContainer();
      }
    }
  };

  const onInput = (event: Event & { currentTarget: HTMLInputElement }) => {
    gesture.updatePending = true;
    inputValue = event.currentTarget.value;
  };

  const onFocus = (event: FocusEvent & { currentTarget: HTMLInputElement }) => {
    event.currentTarget.select();
    gesture.originalElements = elements;
    gesture.originalAppState = cloneJSON(appState);
  };

  const onBlur = (event: FocusEvent & { currentTarget: HTMLInputElement }) => {
    if (!inputValue) {
      inputValue = value.toString();
    } else if (editable) {
      handleInputValue(
        event.currentTarget.value,
        gesture.originalElements,
        gesture.originalAppState,
      );
    }
  };
</script>

{#if editable}
  <div class="drag-input-container" data-testid={label}>
    <!-- svelte-ignore a11y_no_static_element_interactions -->
    <div
      class="drag-input-label"
      bind:this={labelEl}
      onpointerdown={onLabelPointerDown}
      onpointerenter={onLabelPointerEnter}
    >
      {#if icon}<InlineIcon {icon} />{:else}{label}{/if}
    </div>
    <input
      class="drag-input"
      autocomplete="off"
      spellcheck="false"
      onkeydown={onKeyDown}
      bind:this={inputEl}
      value={inputValue}
      oninput={onInput}
      onfocus={onFocus}
      onblur={onBlur}
      disabled={!editable}
      {@attach trackInput}
    />
  </div>
{/if}
