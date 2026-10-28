<script lang="ts">
  import { onDestroy, untrack } from "svelte";

  import {
    getBoundTextElement,
    getCommonBoundingBox,
    getElementAbsoluteCoords,
    getLinearElementSubType,
  } from "@svelte-draw/element";

  import { pointFrom, pointRotateRads } from "@svelte-draw/math";

  import { CLASSES, sceneCoordsToViewportCoords } from "@svelte-draw/common";

  import type {
    ConvertibleGenericTypes,
    ConvertibleLinearTypes,
  } from "@svelte-draw/element/types";

  import { trackEvent } from "../analytics";
  import { getEditorContext } from "../ui/editorContext";

  import {
    FONT_SIZE_CONVERSION_CACHE,
    LINEAR_ELEMENT_CONVERSION_CACHE,
    convertElementTypePopupAtom,
    convertElementTypes,
    filterGenericConvetibleElements,
    filterLinearConvertibleElements,
    getConversionTypeFromElements,
    getConvertibleType,
    toCacheKey,
    type ConversionType,
  } from "./ConvertElementTypePopup";
  import IconButton from "./IconButton.svelte";
  import {
    DiamondIcon,
    elbowArrowIcon,
    EllipseIcon,
    LineIcon,
    RectangleIcon,
    roundArrowIcon,
    sharpArrowIcon,
    type IconDef,
  } from "./icons";

  import type App from "./App";

  import "./ConvertElementTypePopup.scss";

  const GAP_HORIZONTAL = 8;
  const GAP_VERTICAL = 10;

  let { app }: { app: App } = $props();

  const ctx = getEditorContext();

  const selectedElements = $derived.by(() => {
    // re-evaluate whenever the editor commits
    void ctx.elements;
    return app.scene.getSelectedElements(ctx.appState);
  });

  let elementsCategory: ConversionType = null;

  // close shape switch panel if selecting different "types" of elements
  $effect(() => {
    if (selectedElements.length === 0) {
      app.updateEditorAtom(convertElementTypePopupAtom, null);
      return;
    }

    const conversionType = getConversionTypeFromElements(selectedElements);

    if (conversionType && !elementsCategory) {
      elementsCategory = conversionType;
    } else if (
      (elementsCategory && !conversionType) ||
      (elementsCategory && conversionType !== elementsCategory)
    ) {
      app.updateEditorAtom(convertElementTypePopupAtom, null);
      elementsCategory = null;
    }
  });

  onDestroy(() => {
    FONT_SIZE_CONVERSION_CACHE.clear();
    LINEAR_ELEMENT_CONVERSION_CACHE.clear();
  });

  const conversionType = $derived(
    getConversionTypeFromElements(selectedElements),
  );

  const genericElements = $derived(
    conversionType === "generic"
      ? filterGenericConvetibleElements(selectedElements)
      : [],
  );
  const linearElements = $derived(
    conversionType === "linear"
      ? filterLinearConvertibleElements(selectedElements)
      : [],
  );

  const sameType = $derived(
    conversionType === "generic"
      ? genericElements.every(
          (element) => element.type === genericElements[0].type,
        )
      : conversionType === "linear"
      ? linearElements.every(
          (element) =>
            getLinearElementSubType(element) ===
            getLinearElementSubType(linearElements[0]),
        )
      : false,
  );

  // the panel only re-anchors when the viewport or the converted elements
  // change (not while an element is merely being moved)
  const positionKey = $derived.by(() => {
    const ids = [...genericElements, ...linearElements]
      .map((el) => el.id)
      .sort((a, b) => a.localeCompare(b));
    const state = ctx.appState;
    return `${state.scrollX}${state.scrollY}${state.offsetTop}${
      state.offsetLeft
    }${state.zoom.value}${ids.join(",")}`;
  });

  const panelPosition = $derived.by(() => {
    void positionKey;
    return untrack(() => {
      const elements = [...genericElements, ...linearElements].sort((a, b) =>
        a.id.localeCompare(b.id),
      );
      if (elements.length === 0) {
        return { x: 0, y: 0 };
      }

      let bottomLeft;

      if (elements.length === 1) {
        const [x1, , , y2, cx, cy] = getElementAbsoluteCoords(
          elements[0],
          app.scene.getNonDeletedElementsMap(),
        );
        bottomLeft = pointRotateRads(
          pointFrom(x1, y2),
          pointFrom(cx, cy),
          elements[0].angle,
        );
      } else {
        const { minX, maxY } = getCommonBoundingBox(elements);
        bottomLeft = pointFrom(minX, maxY);
      }

      const { x, y } = sceneCoordsToViewportCoords(
        { sceneX: bottomLeft[0], sceneY: bottomLeft[1] },
        ctx.appState,
      );
      return { x, y };
    });
  });

  $effect(() => {
    for (const linearElement of linearElements) {
      const cacheKey = toCacheKey(
        linearElement.id,
        getConvertibleType(linearElement),
      );
      if (!LINEAR_ELEMENT_CONVERSION_CACHE.has(cacheKey)) {
        LINEAR_ELEMENT_CONVERSION_CACHE.set(cacheKey, linearElement);
      }
    }
  });

  $effect(() => {
    for (const element of genericElements) {
      if (!FONT_SIZE_CONVERSION_CACHE.has(element.id)) {
        const boundText = getBoundTextElement(
          element,
          app.scene.getNonDeletedElementsMap(),
        );
        if (boundText) {
          FONT_SIZE_CONVERSION_CACHE.set(element.id, {
            fontSize: boundText.fontSize,
          });
        }
      }
    }
  });

  const SHAPES: [string, IconDef][] = $derived(
    conversionType === "linear"
      ? [
          ["line", LineIcon],
          ["sharpArrow", sharpArrowIcon],
          ["curvedArrow", roundArrowIcon],
          ["elbowArrow", elbowArrowIcon],
        ]
      : conversionType === "generic"
      ? [
          ["rectangle", RectangleIcon],
          ["diamond", DiamondIcon],
          ["ellipse", EllipseIcon],
        ]
      : [],
  );

  let panelEl = $state<HTMLDivElement | null>(null);
</script>

<div
  bind:this={panelEl}
  tabindex="-1"
  style:position="absolute"
  style:top="{panelPosition.y +
    (GAP_VERTICAL + 8) * ctx.appState.zoom.value -
    ctx.appState.offsetTop}px"
  style:left="{panelPosition.x - ctx.appState.offsetLeft - GAP_HORIZONTAL}px"
  style:z-index="2"
  class={CLASSES.CONVERT_ELEMENT_TYPE_POPUP}
>
  {#each SHAPES as [type, icon] (`${selectedElements[0].id}${selectedElements[0].version}_${type}`)}
    {@const isSelected =
      sameType &&
      ((conversionType === "generic" && genericElements[0].type === type) ||
        (conversionType === "linear" &&
          getLinearElementSubType(linearElements[0]) === type))}
    <IconButton
      type="toggle"
      {icon}
      checked={isSelected}
      title={type}
      aria-label={type}
      data-testid={`toolbar-${type}`}
      onSelect={() => {
        // selecting the already-selected type is a no-op
        if (isSelected) {
          return;
        }
        if (app.state.activeTool.type !== type) {
          trackEvent("convertElementType", type, "ui");
        }
        convertElementTypes(app, {
          conversionType,
          nextType: type as ConvertibleGenericTypes | ConvertibleLinearTypes,
        });
        panelEl?.focus();
      }}
    />
  {/each}
</div>
