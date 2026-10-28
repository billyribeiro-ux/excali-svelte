<script lang="ts">
  import { setExcalidrawAPIContext } from "../ui/apiContext";
  import {
    useAppStateValue,
    useOnAppStateChange,
  } from "../hooks/appStateValue.svelte";

  import type { AppState, SvelteDrawAPI } from "../types";

  let {
    api,
    hook,
    renderSpy,
    callback,
  }: {
    api: SvelteDrawAPI;
    hook: "useAppStateValue" | "useOnAppStateChange";
    /** called every time the consumer "renders" (its output is recomputed) */
    renderSpy: (value: unknown) => void;
    callback?: (value: AppState["viewModeEnabled"], appState: AppState) => void;
  } = $props();

  // stands in for <SvelteDrawAPIProvider> with a mock API already published
  // svelte-ignore state_referenced_locally
  const providedAPI = api;
  setExcalidrawAPIContext({
    get api() {
      return providedAPI;
    },
    set() {},
  });

  // svelte-ignore state_referenced_locally
  const valueHook =
    hook === "useAppStateValue" ? useAppStateValue("viewModeEnabled") : null;
  // svelte-ignore state_referenced_locally
  const changeResult =
    hook === "useOnAppStateChange"
      ? (useOnAppStateChange("viewModeEnabled", (value, appState) =>
          callback?.(value, appState),
        ) as unknown)
      : undefined;

  const value = $derived(valueHook ? valueHook.current : changeResult);

  $effect(() => {
    renderSpy(value);
  });
</script>

<div data-testid="value">{String(value)}</div>
