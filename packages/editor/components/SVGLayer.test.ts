import { tick } from "svelte";
import { render } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import SVGLayer from "./SVGLayer.svelte";

import type { Trail } from "../animatedTrail";

const makeTrail = () => ({ start: vi.fn(), stop: vi.fn() } as unknown as Trail);

describe("SVGLayer", () => {
  it("renders an svg inside the layer and starts the trails on it", async () => {
    const trails = [makeTrail(), makeTrail()];
    const { container } = render(SVGLayer, { trails });
    await tick();
    const svg = container.querySelector(".SVGLayer > svg");
    expect(svg).not.toBeNull();
    for (const trail of trails) {
      expect(trail.start).toHaveBeenCalledWith(svg);
    }
  });

  it("stops the trails on destroy", async () => {
    const trails = [makeTrail()];
    const { unmount } = render(SVGLayer, { trails });
    await tick();
    unmount();
    expect(trails[0].stop).toHaveBeenCalledTimes(1);
  });

  it("restarts when the trails change", async () => {
    const first = [makeTrail()];
    const second = [makeTrail()];
    const { rerender } = render(SVGLayer, { trails: first });
    await tick();
    await rerender({ trails: second });
    await tick();
    expect(first[0].stop).toHaveBeenCalledTimes(1);
    expect(second[0].start).toHaveBeenCalledTimes(1);
  });
});
