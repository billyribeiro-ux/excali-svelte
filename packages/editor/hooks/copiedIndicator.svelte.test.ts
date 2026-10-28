import { flushSync } from "svelte";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createCopyStatus } from "./copiedIndicator.svelte";

describe("createCopyStatus", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  const create = () => {
    let status!: ReturnType<typeof createCopyStatus>;
    const destroy = $effect.root(() => {
      status = createCopyStatus();
    });
    return { status, destroy };
  };

  it("reports success for 2s after onCopy", () => {
    const { status, destroy } = create();
    expect(status.copyStatus).toBeNull();
    status.onCopy();
    expect(status.copyStatus).toBe("success");
    vi.advanceTimersByTime(1999);
    expect(status.copyStatus).toBe("success");
    vi.advanceTimersByTime(1);
    expect(status.copyStatus).toBeNull();
    destroy();
  });

  it("restarts the countdown on repeated copies", () => {
    const { status, destroy } = create();
    status.onCopy();
    vi.advanceTimersByTime(1500);
    status.onCopy();
    vi.advanceTimersByTime(1500);
    expect(status.copyStatus).toBe("success");
    vi.advanceTimersByTime(500);
    expect(status.copyStatus).toBeNull();
    destroy();
  });

  it("can be reset manually", () => {
    const { status, destroy } = create();
    status.onCopy();
    status.resetCopyStatus();
    expect(status.copyStatus).toBeNull();
    destroy();
  });

  it("clears the pending timer on destroy", () => {
    const { status, destroy } = create();
    flushSync();
    status.onCopy();
    destroy();
    expect(vi.getTimerCount()).toBe(0);
  });
});
