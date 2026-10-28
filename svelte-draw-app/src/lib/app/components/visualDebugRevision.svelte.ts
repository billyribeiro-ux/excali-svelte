/**
 * Reactive "the visual debugger state (`window.visualDebug`) changed" counter.
 *
 * `window.visualDebug` is a plain (non-reactive) global. In the React app the
 * `refresh` callback forced a re-render of the whole tree after toggling it;
 * Svelte components that depend on `isVisualDebuggerEnabled()` read
 * `visualDebugRevision.current` first so they re-evaluate when it is bumped.
 */
let revision = $state(0);

export const visualDebugRevision = {
  get current() {
    return revision;
  },
};

export const bumpVisualDebugRevision = () => {
  revision += 1;
};
