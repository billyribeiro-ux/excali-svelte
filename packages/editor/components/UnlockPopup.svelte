<script lang="ts">
  import {
    getCommonBounds,
    getElementsInGroup,
    isNonDeletedElement,
    selectGroupsFromGivenElements,
  } from "@svelte-draw/element";
  import { sceneCoordsToViewportCoords } from "@svelte-draw/common";

  import type { NonDeletedExcalidrawElement } from "@svelte-draw/element/types";

  import { actionToggleElementLock } from "../actions/actionElementLock";
  import { flushSync } from "../editor/Editor";
  import { t } from "../i18n";
  import { getEditorContext } from "../ui/editorContext";

  import Icon from "./Icon.svelte";
  import { LockedIconFilled } from "./icons";

  import "./UnlockPopup.scss";

  import type { AppClassProperties, AppState } from "../types";

  type Props = {
    app: AppClassProperties;
    activeLockedId: NonNullable<AppState["activeLockedId"]>;
  };

  let { app, activeLockedId }: Props = $props();

  // reactive appState (scroll/zoom/offsets) of the mounted editor
  const ctx = getEditorContext();

  const elements = $derived.by(() => {
    // re-resolve when the editor commits
    void ctx.elements;
    const candidateElement = app.scene.getElement(activeLockedId);
    // SAFETY: This should never happen, but log it just in case
    if (candidateElement && !isNonDeletedElement(candidateElement)) {
      console.error(
        "[NONDELETED][INVARIANT] UnlockPopup: activeLockedId points to a deleted element",
      );
    }
    const element: NonDeletedExcalidrawElement | null =
      candidateElement && isNonDeletedElement(candidateElement)
        ? candidateElement
        : null;

    return element
      ? [element]
      : getElementsInGroup<NonDeletedExcalidrawElement>(
          app.scene.getNonDeletedElementsMap(),
          activeLockedId,
        );
  });

  const position = $derived.by(() => {
    if (elements.length === 0) {
      return null;
    }
    const appState = ctx.appState;
    const [x, y] = getCommonBounds(elements);
    const { x: viewX, y: viewY } = sceneCoordsToViewportCoords(
      { sceneX: x, sceneY: y },
      appState,
    );
    return {
      bottom: appState.height + 12 - viewY + appState.offsetTop,
      left: viewX - appState.offsetLeft,
    };
  });

  const unlock = () => {
    flushSync(() => {
      const groupIds = selectGroupsFromGivenElements(elements, app.state);
      ctx.setAppState({
        selectedElementIds: elements.reduce(
          (acc, element) => ({
            ...acc,
            [element.id]: true,
          }),
          {},
        ),
        selectedGroupIds: groupIds,
        activeLockedId: null,
      });
    });
    ctx.actionManager.executeAction(actionToggleElementLock);
  };
</script>

{#if position}
  <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
  <div
    class="UnlockPopup"
    style:bottom="{position.bottom}px"
    style:left="{position.left}px"
    onclick={unlock}
    title={t("labels.elementLock.unlock")}
  >
    <Icon icon={LockedIconFilled} />
  </div>
{/if}
