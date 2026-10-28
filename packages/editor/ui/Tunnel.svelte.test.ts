import { render } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";

import TunnelHarness from "./TunnelHarness.test.svelte";

describe("Tunnel", () => {
  it("renders In content at the Out location and removes it on unmount", async () => {
    const { container, rerender } = render(TunnelHarness, { showIn: true });
    expect(container.querySelector("[data-testid=out] .tunneled")).not.toBeNull();
    expect(container.querySelector("[data-testid=in] .tunneled")).toBeNull();

    await rerender({ showIn: false });
    expect(container.querySelector(".tunneled")).toBeNull();
  });
});
