import { flushSync } from "svelte";
import { describe, expect, it } from "vitest";

import { Emitter } from "@svelte-draw/common";

import { createEmitterValue } from "./emitter.svelte";

describe("createEmitterValue", () => {
  it("starts with the initial value and follows emitted events", () => {
    const emitter = new Emitter<[number]>();
    let value!: ReturnType<typeof createEmitterValue<number>>;
    const destroy = $effect.root(() => {
      value = createEmitterValue(emitter, 1);
    });
    flushSync();
    expect(value.current).toBe(1);

    emitter.trigger(5);
    expect(value.current).toBe(5);
    destroy();
  });

  it("unsubscribes on destroy", () => {
    const emitter = new Emitter<[number]>();
    let value!: ReturnType<typeof createEmitterValue<number>>;
    const destroy = $effect.root(() => {
      value = createEmitterValue(emitter, 0);
    });
    flushSync();
    expect(emitter.subscribers).toHaveLength(1);
    destroy();
    expect(emitter.subscribers).toHaveLength(0);
    emitter.trigger(9);
    expect(value.current).toBe(0);
  });

  it("is reactive for effects reading it", () => {
    const emitter = new Emitter<[string]>();
    const seen: string[] = [];
    const destroy = $effect.root(() => {
      const value = createEmitterValue(emitter, "a");
      $effect(() => {
        seen.push(value.current);
      });
    });
    flushSync();
    emitter.trigger("b");
    flushSync();
    expect(seen).toEqual(["a", "b"]);
    destroy();
  });

  it("accepts a getter and re-subscribes when the emitter changes", () => {
    const first = new Emitter<[number]>();
    const second = new Emitter<[number]>();
    let current = $state(first);
    let value!: ReturnType<typeof createEmitterValue<number>>;
    const destroy = $effect.root(() => {
      value = createEmitterValue(() => current, 0);
    });
    flushSync();
    expect(first.subscribers).toHaveLength(1);
    current = second;
    flushSync();
    expect(first.subscribers).toHaveLength(0);
    expect(second.subscribers).toHaveLength(1);
    second.trigger(3);
    expect(value.current).toBe(3);
    destroy();
  });
});
