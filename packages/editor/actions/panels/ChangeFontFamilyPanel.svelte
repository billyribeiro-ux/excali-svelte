<script lang="ts">
  import { untrack } from "svelte";

  import { DEFAULT_FONT_FAMILY } from "@svelte-draw/common";

  import {
    getBoundTextElement,
    isTextElement,
    newElementWith,
  } from "@svelte-draw/element";

  import FontPicker from "../../components/FontPicker/FontPicker.svelte";
  import {
    restoreCaretPosition,
    withCaretPositionPreservation,
  } from "../../hooks/textEditorFocus.svelte";
  import { t } from "../../i18n";
  import { getSelectedElements } from "../../scene";

  import { getFormValue, getStylesPanelInfo } from "./propertiesHelpers";

  import type {
    ElementsMap,
    ExcalidrawElement,
    FontFamilyValues,
  } from "@svelte-draw/element/types";

  import type { AppState } from "../../types";
  import type { ActionPanelProps } from "../types";

  type ChangeFontFamilyData = Partial<
    Pick<
      AppState,
      | "openPopup"
      | "currentItemFontFamily"
      | "currentHoveredFontFamily"
      | "fontTopPicks"
    >
  > & {
    /** cache of selected & editing elements populated on opened popup */
    cachedElements?: ElementsMap;
    /** flag to reset all elements to their cached versions  */
    resetAll?: true;
    /** flag to reset all containers to their cached versions */
    resetContainers?: true;
  };

  let { elements, appState, app, updateData }: ActionPanelProps = $props();

  // cache of selected & editing elements, populated when the popup opens
  const cachedElements: ElementsMap = new Map();
  let prevSelectedFontFamily: number | null = null;
  // relying on state batching as multiple `FontPicker` handlers could be
  // called in rapid succession and we want to combine them
  let batchedData = $state.raw<ChangeFontFamilyData>({});

  const stylesPanelMode = $derived(getStylesPanelInfo(app).stylesPanelMode);
  const isCompact = $derived(getStylesPanelInfo(app).isCompact);

  const selectedFontFamily = $derived.by(() => {
    const getFontFamily = (
      elementsArray: readonly ExcalidrawElement[],
      elementsMap: ElementsMap,
    ) =>
      getFormValue(
        elementsArray,
        app,
        (element) => {
          if (isTextElement(element)) {
            return element.fontFamily;
          }
          const boundTextElement = getBoundTextElement(element, elementsMap);
          if (boundTextElement) {
            return boundTextElement.fontFamily;
          }
          return null;
        },
        (element) =>
          isTextElement(element) ||
          getBoundTextElement(element, elementsMap) !== null,
        (hasSelection) =>
          hasSelection
            ? null
            : appState.currentItemFontFamily || DEFAULT_FONT_FAMILY,
      );

    // popup opened, use cached elements
    if (
      batchedData.openPopup === "fontFamily" &&
      appState.openPopup === "fontFamily"
    ) {
      prevSelectedFontFamily = getFontFamily(
        Array.from(cachedElements.values()),
        cachedElements,
      );
      return prevSelectedFontFamily;
    }

    // popup closed, use all elements
    if (!batchedData.openPopup && appState.openPopup !== "fontFamily") {
      prevSelectedFontFamily = getFontFamily(
        elements,
        app.scene.getNonDeletedElementsMap(),
      );
      return prevSelectedFontFamily;
    }

    // popup props are not in sync, hence we are in the middle of an update,
    // so keeping the previous value we've had
    return prevSelectedFontFamily;
  });

  // flush the combined handler data through the action, only on internal
  // state changes
  $effect(() => {
    const data = batchedData;
    if (Object.keys(data).length) {
      untrack(() => {
        updateData(data);
      });
      // reset the data after we've used the data
      batchedData = {};
    }
  });

  const onPopupChange = (open: boolean) => {
    if (open) {
      // open, populate the cache from scratch
      cachedElements.clear();

      const { editingTextElement } = appState;

      // still check type to be safe
      if (editingTextElement?.type === "text") {
        // retrieve the latest version from the scene, as `editingTextElement`
        // isn't mutated
        const latesteditingTextElement = app.scene.getElement(
          editingTextElement.id,
        );

        // inside the wysiwyg editor
        cachedElements.set(
          editingTextElement.id,
          newElementWith(
            latesteditingTextElement || editingTextElement,
            {},
            true,
          ),
        );
      } else {
        const selectedElements = getSelectedElements(elements, appState, {
          includeBoundTextElement: true,
        });

        for (const element of selectedElements) {
          cachedElements.set(element.id, newElementWith(element, {}, true));
        }
      }

      batchedData = {
        ...batchedData,
        openPopup: "fontFamily",
      };
    } else {
      batchedData = {
        currentHoveredFontFamily: null,
        cachedElements: new Map(cachedElements),
        resetAll: true,
      };
      cachedElements.clear();

      // Refocus text editor when font picker closes if we were editing text
      if (isCompact && appState.editingTextElement) {
        restoreCaretPosition(null, app.ownerDocument); // Just refocus without saved position
      }
    }
  };
</script>

{#if stylesPanelMode === "full"}
  <legend>{t("labels.fontFamily")}</legend>
{/if}
<FontPicker
  isOpened={appState.openPopup === "fontFamily"}
  {selectedFontFamily}
  hoveredFontFamily={appState.currentHoveredFontFamily}
  topPicks={appState.fontTopPicks}
  compactMode={stylesPanelMode !== "full"}
  onTopPicksChange={(fontTopPicks: FontFamilyValues[] | null) =>
    updateData({ fontTopPicks })}
  onSelect={(fontFamily: FontFamilyValues) => {
    withCaretPositionPreservation(
      () => {
        batchedData = {
          openPopup: null,
          currentHoveredFontFamily: null,
          currentItemFontFamily: fontFamily,
        };
        // defensive clear so immediate close won't abuse the cached elements
        cachedElements.clear();
      },
      isCompact,
      !!appState.editingTextElement,
    );
  }}
  onHover={(fontFamily: FontFamilyValues) => {
    batchedData = {
      currentHoveredFontFamily: fontFamily,
      cachedElements: new Map(cachedElements),
      resetContainers: true,
    };
  }}
  onLeave={() => {
    batchedData = {
      currentHoveredFontFamily: null,
      cachedElements: new Map(cachedElements),
      resetAll: true,
    };
  }}
  {onPopupChange}
/>
