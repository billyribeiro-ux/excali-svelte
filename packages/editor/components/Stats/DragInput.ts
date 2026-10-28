import type {
  ElementsMap,
  ExcalidrawElement,
  NonDeletedExcalidrawElement,
} from "@svelte-draw/element/types";

import type { Scene } from "@svelte-draw/element";

import type { StatsInputProperty } from "./utils";
import type { AppClassProperties, AppState } from "../../types";

export type DragInputCallbackType<
  P extends StatsInputProperty,
  E = NonDeletedExcalidrawElement,
> = (props: {
  accumulatedChange: number;
  instantChange: number;
  originalElements: readonly E[];
  originalElementsMap: ElementsMap;
  shouldKeepAspectRatio: boolean;
  shouldChangeByStepSize: boolean;
  scene: Scene;
  nextValue?: number;
  property: P;
  originalAppState: AppState;
  setInputValue: (value: number) => void;
  app: AppClassProperties;
  setAppState: AppClassProperties["setAppState"];
}) => void;

export type DragFinishedCallbackType<E = ExcalidrawElement> = (props: {
  app: AppClassProperties;
  setAppState: AppClassProperties["setAppState"];
  originalElements: readonly E[] | null;
  originalAppState: AppState;
}) => void;
