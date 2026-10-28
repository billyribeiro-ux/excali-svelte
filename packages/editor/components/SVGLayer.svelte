<script lang="ts">
  import "./SVGLayer.scss";

  import type { Trail } from "../animatedTrail";

  let { trails }: { trails: Trail[] } = $props();

  let svg = $state<SVGSVGElement | null>(null);

  // the parent passes a fresh array each render; like React's deps-by-element
  // `useEffect(..., trails)`, only restart the trails when an element changed
  let previousTrails: Trail[] | null = null;
  const stableTrails = $derived.by(() => {
    const next = trails;
    if (
      previousTrails &&
      previousTrails.length === next.length &&
      previousTrails.every((trail, index) => trail === next[index])
    ) {
      return previousTrails;
    }
    previousTrails = next;
    return next;
  });

  $effect(() => {
    const current = stableTrails;
    if (svg) {
      for (const trail of current) {
        trail.start(svg);
      }
    }

    return () => {
      for (const trail of current) {
        trail.stop();
      }
    };
  });
</script>

<div class="SVGLayer">
  <svg bind:this={svg}></svg>
</div>
