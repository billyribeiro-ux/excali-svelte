import { throttleRAF } from "@svelte-draw/common";

/**
 * Event handlers used to be wrapped in `unstable_batchedUpdates` so React
 * grouped the `setState` calls they make. `Editor` commits queued updates
 * together once the handler returns (see `editor/Editor.ts`), so this is the
 * identity; it is kept so call sites still mark which handlers are
 * update-batching entry points.
 *
 * @param func handler taking at most single parameter (event).
 */
export const withBatchedUpdates = <
  TFunction extends ((event: any) => void) | (() => void),
>(
  func: Parameters<TFunction>["length"] extends 0 | 1 ? TFunction : never,
) => func as unknown as TFunction;

/**
 * throttles the calls to a single call per animation frame (updates the handler
 * makes are committed together by `Editor`)
 */
export const withBatchedUpdatesThrottled = <
  TFunction extends ((event: any) => void) | (() => void),
>(
  func: Parameters<TFunction>["length"] extends 0 | 1 ? TFunction : never,
  ownerWindow: Window = window,
) => {
  return throttleRAF<Parameters<TFunction>>(
    func as unknown as (...args: Parameters<TFunction>) => void,
    ownerWindow,
  );
};

export const isRenderThrottlingEnabled = () =>
  window.EXCALIDRAW_THROTTLE_RENDER === true;
