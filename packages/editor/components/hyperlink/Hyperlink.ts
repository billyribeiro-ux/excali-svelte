import { pointFrom, type GlobalPoint } from "@svelte-draw/math";

import {
  HYPERLINK_TOOLTIP_DELAY,
  getTargetWindow,
  sceneCoordsToViewportCoords,
  viewportCoordsToSceneCoords,
} from "@svelte-draw/common";

import {
  getElementAbsoluteCoords,
  hitElementBoundingBox,
  isElementLink,
  isEmbeddableElement,
} from "@svelte-draw/element";

import type {
  ElementsMap,
  ExcalidrawEmbeddableElement,
  NonDeletedExcalidrawElement,
} from "@svelte-draw/element/types";

import { trackEvent } from "../../analytics";
import {
  TOOLTIP_VISIBLE_CLASS,
  getTooltipDiv,
  hideDocumentTooltip,
  updateTooltipPosition,
} from "../Tooltip";

import { t } from "../../i18n";

import { getSelectedElements } from "../../scene";

import { getLinkHandleFromCoords } from "./helpers";

import type { AppState, UIAppState } from "../../types";

export const POPUP_WIDTH = 380;
export const POPUP_HEIGHT = 42;
export const POPUP_PADDING = 5;
export const SPACE_BOTTOM = 85;
export const AUTO_HIDE_TIMEOUT = 500;

export type HyperlinkTooltipOwner = Record<string, unknown>;

let IS_HYPERLINK_TOOLTIP_VISIBLE = false;
let HYPERLINK_TOOLTIP_OWNER: HyperlinkTooltipOwner | null = null;
let HYPERLINK_TOOLTIP_OWNER_DOCUMENT: Document | null = null;
let HYPERLINK_TOOLTIP_OWNER_WINDOW: Window | null = null;

// When the owning window loses focus, the pointer leaves it, or it is
// hidden (pagehide on close/navigation), no in-window event will ever
// call hideHyperlinkToolip again, and a sibling window's hide call is a
// no-op due to the ownership guard, so the owning window itself must
// drop the tooltip in that case.
const TOOLTIP_WINDOW_CLEANUPS = new WeakMap<Window, void>();

const registerTooltipWindowCleanup = (ownerWindow: Window) => {
  if (TOOLTIP_WINDOW_CLEANUPS.has(ownerWindow)) {
    return;
  }
  const dropIfOwned = () => {
    if (HYPERLINK_TOOLTIP_OWNER_WINDOW === ownerWindow) {
      clearHyperlinkTooltip();
    }
  };
  const onPointerOut = (event: MouseEvent) => {
    // relatedTarget is null only when the pointer left the window
    if (event.relatedTarget === null) {
      dropIfOwned();
    }
  };
  ownerWindow.addEventListener("blur", dropIfOwned);
  ownerWindow.addEventListener("mouseout", onPointerOut);
  // covers window close/navigation that skips blur, so the globals
  // never retain the detached document/window
  ownerWindow.addEventListener("pagehide", dropIfOwned);
  TOOLTIP_WINDOW_CLEANUPS.set(ownerWindow, undefined);
};

export const embeddableLinkCache = new Map<
  ExcalidrawEmbeddableElement["id"],
  string
>();

export const getCoordsForPopover = (
  element: NonDeletedExcalidrawElement,
  appState: AppState,
  elementsMap: ElementsMap,
) => {
  const [x1, y1] = getElementAbsoluteCoords(element, elementsMap);
  const { x: viewportX, y: viewportY } = sceneCoordsToViewportCoords(
    { sceneX: x1 + element.width / 2, sceneY: y1 },
    appState,
  );
  const x = viewportX - appState.offsetLeft - POPUP_WIDTH / 2;
  const y = viewportY - appState.offsetTop - SPACE_BOTTOM;
  return { x, y };
};

export const getContextMenuLabel = (
  elements: readonly NonDeletedExcalidrawElement[],
  appState: UIAppState,
) => {
  const selectedElements = getSelectedElements(elements, appState);
  const label = isEmbeddableElement(selectedElements[0])
    ? "labels.link.editEmbed"
    : selectedElements[0]?.link
    ? "labels.link.edit"
    : "labels.link.create";
  return label;
};

let HYPERLINK_TOOLTIP_TIMEOUT_ID: number | null = null;
export const showHyperlinkTooltip = (
  element: NonDeletedExcalidrawElement,
  appState: AppState,
  elementsMap: ElementsMap,
  ownerDocument: Document,
  owner: HyperlinkTooltipOwner,
) => {
  const ownerWindow = getTargetWindow(ownerDocument);
  if (!ownerWindow) {
    return;
  }
  // there's only ever one tooltip visible, so take over the ownership from
  // whichever App currently holds it. Without this, a tooltip shown by
  // another App would stay visible forever, as that App no longer receives
  // the pointer events that would hide it.
  if (HYPERLINK_TOOLTIP_OWNER && HYPERLINK_TOOLTIP_OWNER !== owner) {
    clearHyperlinkTooltip();
  } else if (HYPERLINK_TOOLTIP_TIMEOUT_ID) {
    // same owner -> only restart the timer, leaving an already visible
    // tooltip alone (this runs on every pointer move over a link)
    HYPERLINK_TOOLTIP_OWNER_WINDOW?.clearTimeout(HYPERLINK_TOOLTIP_TIMEOUT_ID);
    HYPERLINK_TOOLTIP_TIMEOUT_ID = null;
  }
  HYPERLINK_TOOLTIP_OWNER = owner;
  HYPERLINK_TOOLTIP_OWNER_DOCUMENT = ownerDocument;
  HYPERLINK_TOOLTIP_OWNER_WINDOW = ownerWindow;
  registerTooltipWindowCleanup(ownerWindow);
  HYPERLINK_TOOLTIP_TIMEOUT_ID = ownerWindow.setTimeout(
    () => renderTooltip(element, appState, elementsMap, ownerDocument, owner),
    HYPERLINK_TOOLTIP_DELAY,
  );
};

const renderTooltip = (
  element: NonDeletedExcalidrawElement,
  appState: AppState,
  elementsMap: ElementsMap,
  ownerDocument: Document,
  owner: HyperlinkTooltipOwner,
) => {
  HYPERLINK_TOOLTIP_TIMEOUT_ID = null;
  // ownership may have been cleared or taken over while the timer was
  // pending (pointer left the window or another App showed its own
  // tooltip) -> don't render a stale tooltip in an unfocused window
  if (HYPERLINK_TOOLTIP_OWNER !== owner) {
    return;
  }
  if (!element.link) {
    return;
  }

  const tooltipDiv = getTooltipDiv(ownerDocument);

  tooltipDiv.classList.add(TOOLTIP_VISIBLE_CLASS);
  tooltipDiv.style.maxWidth = "20rem";
  tooltipDiv.textContent = isElementLink(element.link)
    ? t("labels.link.goToElement")
    : element.link;

  const [x1, y1, x2, y2] = getElementAbsoluteCoords(element, elementsMap);

  const [linkX, linkY, linkWidth, linkHeight] = getLinkHandleFromCoords(
    [x1, y1, x2, y2],
    element.angle,
    appState,
  );

  const linkViewportCoords = sceneCoordsToViewportCoords(
    { sceneX: linkX, sceneY: linkY },
    appState,
  );

  updateTooltipPosition(
    tooltipDiv,
    {
      left: linkViewportCoords.x,
      top: linkViewportCoords.y,
      width: linkWidth,
      height: linkHeight,
    },
    "top",
  );
  trackEvent("hyperlink", "tooltip", "link-icon");

  IS_HYPERLINK_TOOLTIP_VISIBLE = true;
};
const clearHyperlinkTooltip = () => {
  if (HYPERLINK_TOOLTIP_TIMEOUT_ID) {
    HYPERLINK_TOOLTIP_OWNER_WINDOW?.clearTimeout(HYPERLINK_TOOLTIP_TIMEOUT_ID);
    HYPERLINK_TOOLTIP_TIMEOUT_ID = null;
  }
  if (IS_HYPERLINK_TOOLTIP_VISIBLE && HYPERLINK_TOOLTIP_OWNER_DOCUMENT) {
    IS_HYPERLINK_TOOLTIP_VISIBLE = false;
    hideDocumentTooltip(HYPERLINK_TOOLTIP_OWNER_DOCUMENT);
  }
  HYPERLINK_TOOLTIP_OWNER = null;
  HYPERLINK_TOOLTIP_OWNER_DOCUMENT = null;
  HYPERLINK_TOOLTIP_OWNER_WINDOW = null;
};

export const hideHyperlinkToolip = (owner?: HyperlinkTooltipOwner) => {
  // another App owns the tooltip (possibly a sibling App in the same
  // document) -> it's not ours to hide
  if (HYPERLINK_TOOLTIP_OWNER && HYPERLINK_TOOLTIP_OWNER !== owner) {
    return;
  }
  clearHyperlinkTooltip();
};

export const shouldHideLinkPopup = (
  element: NonDeletedExcalidrawElement,
  elementsMap: ElementsMap,
  appState: AppState,
  [clientX, clientY]: GlobalPoint,
): boolean => {
  const { x: sceneX, y: sceneY } = viewportCoordsToSceneCoords(
    { clientX, clientY },
    appState,
  );

  const threshold = 15 / appState.zoom.value;
  // hitbox to prevent hiding when hovered in element bounding box
  if (hitElementBoundingBox(pointFrom(sceneX, sceneY), element, elementsMap)) {
    return false;
  }
  const [x1, y1, x2] = getElementAbsoluteCoords(element, elementsMap);
  // hit box to prevent hiding when hovered in the vertical area between element and popover
  if (
    sceneX >= x1 &&
    sceneX <= x2 &&
    sceneY >= y1 - SPACE_BOTTOM &&
    sceneY <= y1
  ) {
    return false;
  }
  // hit box to prevent hiding when hovered around popover within threshold
  const { x: popoverX, y: popoverY } = getCoordsForPopover(
    element,
    appState,
    elementsMap,
  );

  if (
    clientX >= popoverX - threshold &&
    clientX <= popoverX + POPUP_WIDTH + POPUP_PADDING * 2 + threshold &&
    clientY >= popoverY - threshold &&
    clientY <= popoverY + threshold + POPUP_PADDING * 2 + POPUP_HEIGHT
  ) {
    return false;
  }
  return true;
};
