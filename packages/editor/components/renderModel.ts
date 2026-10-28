import type {
  ExcalidrawFrameLikeElement,
  IframeData,
  NonDeleted,
  NonDeletedExcalidrawElement,
  NonDeletedSceneElementsMap,
  Ordered,
  ExcalidrawIframeLikeElement,
} from "@svelte-draw/element/types";

import type { AppState } from "../types";

import type {
  RenderableElementsMap,
  StaticCanvasRenderConfig,
} from "../scene/types";

/**
 * Everything the Svelte view needs for one editor commit. Computed once per
 * commit by `App.computeRenderModel()` — in the position React's `render()`
 * used to run — so the render-time side effects the editor relies on
 * (`visibleElements`, `initializedEmbeds`, …) keep their ordering.
 */
export type RenderModel = {
  selectedElements: readonly NonDeletedExcalidrawElement[];
  firstSelectedElement: NonDeletedExcalidrawElement | undefined;
  renderableElementsMap: RenderableElementsMap;
  allElementsMap: NonDeletedSceneElementsMap;
  visibleElements: readonly NonDeletedExcalidrawElement[];
  /** `visibleElements`, with render-override offsets applied for the static canvas */
  staticVisibleElements: readonly NonDeletedExcalidrawElement[];
  canvasNonce: string;
  /** element drawn on the new-element canvas (an in-progress element or a tool-drag preview) */
  previewElement: NonNullable<AppState["newElement"]> | null;
  isToolDragPreview: boolean;
  shouldBlockPointerEvents: boolean;
  showShapeSwitchPanel: boolean;
  frameNames: FrameNameRenderModel[];
  embeddables: EmbeddableRenderModel[];
  /** feature flags derived from the editor's props/state */
  flags: {
    defaultUIEnabled: boolean;
    interactionEnabled: boolean;
    navigationEnabled: boolean;
    fileDropEnabled: boolean;
    zoomUIEnabled: boolean;
    scrollBackToContentUIEnabled: boolean;
    showExitZenModeBtn: boolean;
    renderWelcomeScreen: boolean;
  };
  /** class names for the editor container (`excalidraw excalidraw-container …`) */
  containerClasses: Record<string, boolean>;
  staticRenderConfig: StaticCanvasRenderConfig;
  newElementRenderConfig: StaticCanvasRenderConfig;
  /** trails drawn on the SVG layer */
  trails: readonly unknown[];
  langCode: string;
  devicePixelRatio: number;
};

export type FrameNameRenderModel = {
  element: ExcalidrawFrameLikeElement;
  domId: string;
  name: string;
  isEditing: boolean;
  isDarkTheme: boolean;
  /** viewport x/y of the frame's top-left (after render overrides) */
  x1: number;
  y1: number;
  opacity: number;
  /** the focused search match highlights this frame's name: drop the width cap */
  uncapWidth: boolean;
};

export type EmbeddableRenderModel = {
  element: Ordered<NonDeleted<ExcalidrawIframeLikeElement>>;
  isVisible: boolean;
  isPendingGeneration: boolean;
  isActive: boolean;
  isHovered: boolean;
  src: IframeData | null;
  /** viewport translation of the element's top-left, offsets included */
  translateX: number;
  translateY: number;
  opacity: number;
  cornerRadius: number;
  viewportScale: number;
};
