import { createSubscriber } from "svelte/reactivity";

import type { Scene } from "@svelte-draw/element";

/**
 * Elements are mutated in place (`scene.mutateElement`), so values derived
 * from them can't rely on object identity. Reading the returned function
 * inside a `$derived`/template registers a dependency on scene updates and
 * returns the current scene nonce (what React re-rendered on).
 */
export const trackSceneNonce = (getScene: () => Scene) => {
  const subscribe = createSubscriber((update) => getScene().onUpdate(update));
  return () => {
    subscribe();
    return getScene().getSceneNonce();
  };
};
