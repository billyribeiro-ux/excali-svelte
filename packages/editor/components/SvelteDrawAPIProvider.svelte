<script lang="ts">
  import type { Snippet } from "svelte";

  import { setExcalidrawAPIContext } from "../ui/apiContext";

  import type { SvelteDrawAPI } from "../types";

  /**
   * Stateless provider that allows `useSvelteDrawAPI()` (and hooks built on
   * it, such as `useAppStateValue()` and `useOnAppStateChange()`) to work
   * outside the <SvelteDraw> component tree.
   */
  let { children }: { children: Snippet } = $props();

  let api = $state.raw<SvelteDrawAPI | null>(null);

  setExcalidrawAPIContext({
    get api() {
      return api;
    },
    set(next) {
      api = next;
    },
  });
</script>

{@render children()}
