<script lang="ts">
  import { onDestroy } from "svelte";
  import { vi } from "vitest";

  import { createColorTopPicksDnD } from "../components/ColorPicker/colorTopPicksDnD";

  let {
    onReady,
  }: {
    onReady: (startPickDrag: ReturnType<typeof createColorTopPicksDnD>["startPickDrag"]) => void;
  } = $props();

  const onPicksChange = vi.fn();
  const drag = createColorTopPicksDnD(() => ({
    enabled: true,
    picks: ["#000000", "#ffffff"],
    onPicksChange,
  }));
  // svelte-ignore state_referenced_locally
  onReady(drag.startPickDrag);

  onDestroy(() => drag.destroy());
</script>

<div {@attach drag.attachStrip}>
  <button data-top-pick-index="0" aria-label="pick 0"></button>
  <button data-top-pick-index="1" aria-label="pick 1"></button>
</div>
