import { createSubscriber } from "svelte/reactivity";

/**
 * A minimal reactive cell that works in plain `.ts` modules (no runes).
 *
 * - `get()` registers a dependency when called inside a Svelte effect,
 *   derived or template expression; outside of those it is a plain read.
 * - `subscribe()` is for imperative (non-Svelte) listeners.
 */
export type Signal<T> = {
  get(): T;
  /** read without registering a dependency */
  peek(): T;
  set(value: T): void;
  subscribe(listener: (value: T) => void): () => void;
};

export const createSignal = <T>(initial: T): Signal<T> => {
  let value = initial;
  const svelteUpdaters = new Set<() => void>();
  const listeners = new Set<(value: T) => void>();

  const track = createSubscriber((update) => {
    svelteUpdaters.add(update);
    return () => {
      svelteUpdaters.delete(update);
    };
  });

  return {
    get() {
      track();
      return value;
    },
    peek() {
      return value;
    },
    set(next) {
      if (Object.is(next, value)) {
        return;
      }
      value = next;
      for (const update of [...svelteUpdaters]) {
        update();
      }
      for (const listener of [...listeners]) {
        listener(next);
      }
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
  };
};
