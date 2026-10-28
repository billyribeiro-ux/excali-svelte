import type { Emitter } from "@svelte-draw/common";

/**
 * Reactive latest value of an emitter's events (replaces `useEmitter`). Call
 * during component initialization; unsubscribes on destroy.
 *
 * `emitter` may be a getter if it can change over the component's lifetime.
 */
export const createEmitterValue = <TEvent>(
  emitter: Emitter<[TEvent]> | (() => Emitter<[TEvent]>),
  initialState: TEvent,
) => {
  let event = $state.raw<TEvent>(initialState);

  $effect(() => {
    const current = typeof emitter === "function" ? emitter() : emitter;
    return current.on((next) => {
      event = next;
    });
  });

  return {
    get current() {
      return event;
    },
  };
};
