<script lang="ts">
  import { onDestroy } from "svelte";
  import throttle from "lodash.throttle";

  import { round } from "@svelte-draw/math";

  import { STATS_PANELS } from "@svelte-draw/common";
  import {
    elementsAreInSameGroup,
    frameAndChildrenSelectedTogether,
    getCommonBounds,
    getUncroppedWidthAndHeight,
    isImageElement,
  } from "@svelte-draw/element";

  import type { NonDeletedExcalidrawElement } from "@svelte-draw/element/types";

  import { t } from "../../i18n";
  import { isGridModeEnabled } from "../../snapping";
  import { getEditorContext } from "../../ui/editorContext";
  import Island from "../Island.svelte";
  import { CloseIcon } from "../icons";
  import Icon from "../Icon.svelte";

  import Angle from "./Angle.svelte";
  import CanvasGrid from "./CanvasGrid.svelte";
  import Collapsible from "./Collapsible.svelte";
  import Dimension from "./Dimension.svelte";
  import FontSize from "./FontSize.svelte";
  import MultiAngle from "./MultiAngle.svelte";
  import MultiDimension from "./MultiDimension.svelte";
  import MultiFontSize from "./MultiFontSize.svelte";
  import MultiPosition from "./MultiPosition.svelte";
  import Position from "./Position.svelte";
  import { trackSceneNonce } from "./sceneNonce";
  import StatsRow from "./StatsRow.svelte";
  import StatsRows from "./StatsRows.svelte";
  import { getAtomicUnits } from "./utils";

  import "./Stats.scss";

  import type { Snippet } from "svelte";
  import type { AppClassProperties, UIAppState } from "../../types";

  type Props = {
    app: AppClassProperties;
    onClose: () => void;
    /** replaces React's `renderCustomStats(elements, appState)` */
    renderCustomStats?: Snippet<
      [readonly NonDeletedExcalidrawElement[], UIAppState]
    >;
  };

  const STATS_TIMEOUT = 50;

  let { app, onClose, renderCustomStats }: Props = $props();

  const ctx = getEditorContext();
  const scene = $derived(app.scene);

  const appState = $derived(ctx.appState);
  const nonce = trackSceneNonce(() => scene);

  const selectedElements = $derived.by(() => {
    nonce();
    return scene.getSelectedElements({
      selectedElementIds: appState.selectedElementIds,
      includeBoundTextElement: false,
    });
  });

  const elements = $derived.by(() => {
    nonce();
    return scene.getNonDeletedElements();
  });
  const elementsMap = $derived.by(() => {
    nonce();
    return scene.getNonDeletedElementsMap();
  });

  const gridModeEnabled = $derived.by(() => {
    void appState;
    return isGridModeEnabled(app);
  });

  const singleElement = $derived(
    selectedElements.length === 1 ? selectedElements[0] : null,
  );
  const multipleElements = $derived(
    selectedElements.length > 1 ? selectedElements : null,
  );

  const croppedImage = $derived(
    appState.croppingElementId && isImageElement(singleElement)
      ? singleElement
      : null,
  );
  const unCroppedDimension = $derived(
    croppedImage ? getUncroppedWidthAndHeight(croppedImage) : null,
  );

  let sceneDimension = $state({ width: 0, height: 0 });

  const throttledSetSceneDimension = throttle(
    (elements: readonly NonDeletedExcalidrawElement[]) => {
      const boundingBox = getCommonBounds(elements);
      sceneDimension = {
        width: Math.round(boundingBox[2]) - Math.round(boundingBox[0]),
        height: Math.round(boundingBox[3]) - Math.round(boundingBox[1]),
      };
    },
    STATS_TIMEOUT,
  );

  $effect(() => {
    nonce();
    throttledSetSceneDimension(elements);
  });

  onDestroy(() => throttledSetSceneDimension.cancel());

  const atomicUnits = $derived(getAtomicUnits(selectedElements, appState));

  const _frameAndChildrenSelectedTogether = $derived(
    frameAndChildrenSelectedTogether(selectedElements),
  );

  const togglePanel = (panel: number) => () =>
    ctx.setAppState((state) => {
      return {
        stats: {
          open: true,
          panels: state.stats.panels ^ panel,
        },
      };
    });
</script>

<div
  class="exc-stats"
  data-viewport-ui="side"
  data-viewport-ui-name="stats"
>
  <Island padding={3}>
    <div class="title">
      <h2>{t("stats.title")}</h2>
      <!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_static_element_interactions -->
      <div class="close" onclick={onClose}>
        <Icon icon={CloseIcon} />
      </div>
    </div>

    <Collapsible
      open={!!(appState.stats.panels & STATS_PANELS.generalStats)}
      openTrigger={togglePanel(STATS_PANELS.generalStats)}
    >
      {#snippet label()}<h3>{t("stats.generalStats")}</h3>{/snippet}
      <StatsRows>
        <StatsRow heading>{t("stats.scene")}</StatsRow>
        <StatsRow columns={2}>
          <div>{t("stats.shapes")}</div>
          <div>{elements.length}</div>
        </StatsRow>
        <StatsRow columns={2}>
          <div>{t("stats.width")}</div>
          <div>{sceneDimension.width}</div>
        </StatsRow>
        <StatsRow columns={2}>
          <div>{t("stats.height")}</div>
          <div>{sceneDimension.height}</div>
        </StatsRow>
        {#if gridModeEnabled}
          <StatsRow heading>Canvas</StatsRow>
          <StatsRow>
            <CanvasGrid
              property="gridStep"
              {scene}
              {appState}
              setAppState={ctx.setAppState}
            />
          </StatsRow>
        {/if}
      </StatsRows>

      {@render renderCustomStats?.(elements, appState)}
    </Collapsible>

    {#if !_frameAndChildrenSelectedTogether && selectedElements.length > 0}
      <div id="elementStats" style="margin-top: 12px;">
        <Collapsible
          open={!!(appState.stats.panels & STATS_PANELS.elementProperties)}
          openTrigger={togglePanel(STATS_PANELS.elementProperties)}
        >
          {#snippet label()}<h3>{t("stats.elementProperties")}</h3>{/snippet}
          <StatsRows>
            {#if singleElement}
              {#if croppedImage}
                <StatsRow heading>{t("labels.unCroppedDimension")}</StatsRow>
              {/if}

              {#if croppedImage && unCroppedDimension}
                <StatsRow columns={2}>
                  <div>{t("stats.width")}</div>
                  <div>{round(unCroppedDimension.width, 2)}</div>
                </StatsRow>
                <StatsRow columns={2}>
                  <div>{t("stats.height")}</div>
                  <div>{round(unCroppedDimension.height, 2)}</div>
                </StatsRow>
              {/if}

              <StatsRow
                heading
                data-testid="stats-element-type"
                style="margin: 0.3125rem 0;"
              >
                {appState.croppingElementId
                  ? t("labels.imageCropping")
                  : t(`element.${singleElement.type}`)}
              </StatsRow>

              <StatsRow>
                <Position
                  element={singleElement}
                  property="x"
                  {elementsMap}
                  {scene}
                  {appState}
                />
              </StatsRow>
              <StatsRow>
                <Position
                  element={singleElement}
                  property="y"
                  {elementsMap}
                  {scene}
                  {appState}
                />
              </StatsRow>
              <StatsRow>
                <Dimension
                  property="width"
                  element={singleElement}
                  {scene}
                  {appState}
                />
              </StatsRow>
              <StatsRow>
                <Dimension
                  property="height"
                  element={singleElement}
                  {scene}
                  {appState}
                />
              </StatsRow>
              <StatsRow>
                <Angle
                  property="angle"
                  element={singleElement}
                  {scene}
                  {appState}
                />
              </StatsRow>
              <StatsRow>
                <FontSize
                  property="fontSize"
                  element={singleElement}
                  {scene}
                  {appState}
                />
              </StatsRow>
            {/if}

            {#if multipleElements}
              {#if elementsAreInSameGroup(multipleElements)}
                <StatsRow heading>{t("element.group")}</StatsRow>
              {/if}

              <StatsRow columns={2} style="margin: 0.3125rem 0;">
                <div>{t("stats.shapes")}</div>
                <div>{selectedElements.length}</div>
              </StatsRow>

              <StatsRow>
                <MultiPosition
                  property="x"
                  elements={multipleElements}
                  {elementsMap}
                  {atomicUnits}
                  {scene}
                  {appState}
                />
              </StatsRow>
              <StatsRow>
                <MultiPosition
                  property="y"
                  elements={multipleElements}
                  {elementsMap}
                  {atomicUnits}
                  {scene}
                  {appState}
                />
              </StatsRow>
              <StatsRow>
                <MultiDimension
                  property="width"
                  elements={multipleElements}
                  {elementsMap}
                  {atomicUnits}
                  {scene}
                  {appState}
                />
              </StatsRow>
              <StatsRow>
                <MultiDimension
                  property="height"
                  elements={multipleElements}
                  {elementsMap}
                  {atomicUnits}
                  {scene}
                  {appState}
                />
              </StatsRow>
              <StatsRow>
                <MultiAngle
                  property="angle"
                  elements={multipleElements}
                  {scene}
                  {appState}
                />
              </StatsRow>
              <StatsRow>
                <MultiFontSize
                  property="fontSize"
                  elements={multipleElements}
                  {scene}
                  {appState}
                  {elementsMap}
                />
              </StatsRow>
            {/if}
          </StatsRows>
        </Collapsible>
      </div>
    {/if}
  </Island>
</div>
