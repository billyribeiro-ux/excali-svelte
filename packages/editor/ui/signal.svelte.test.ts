import { flushSync } from "svelte";
import { describe, expect, it, vi } from "vitest";

import { atom, AtomStore, useAtom } from "../editor-jotai";

import { createSignal } from "./signal";

describe("createSignal", () => {
  it("re-runs effects that read it when set", () => {
    const signal = createSignal(1);
    const seen: number[] = [];
    const cleanup = $effect.root(() => {
      $effect(() => {
        seen.push(signal.get());
      });
    });
    flushSync();
    signal.set(2);
    flushSync();
    signal.set(2); // same value: no re-run
    flushSync();
    expect(seen).toEqual([1, 2]);
    cleanup();
  });

  it("does not track peek()", () => {
    const signal = createSignal(1);
    const run = vi.fn();
    const cleanup = $effect.root(() => {
      $effect(() => {
        signal.peek();
        run();
      });
    });
    flushSync();
    signal.set(2);
    flushSync();
    expect(run).toHaveBeenCalledTimes(1);
    cleanup();
  });

  it("notifies imperative subscribers", () => {
    const signal = createSignal("a");
    const listener = vi.fn();
    const off = signal.subscribe(listener);
    signal.set("b");
    off();
    signal.set("c");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith("b");
  });
});

describe("atom store", () => {
  it("supports values and updater functions", () => {
    const count = atom(0);
    const store = new AtomStore();
    store.set(count, 2);
    store.set(count, (prev) => prev + 3);
    expect(store.get(count)).toBe(5);
  });

  it("keeps stores isolated from each other", () => {
    const flag = atom(false);
    const a = new AtomStore();
    const b = new AtomStore();
    a.set(flag, true);
    expect(b.get(flag)).toBe(false);
  });

  it("useAtom exposes a reactive current", () => {
    const value = atom(1);
    const store = new AtomStore();
    const handle = useAtom(value, store);
    const seen: number[] = [];
    const cleanup = $effect.root(() => {
      $effect(() => {
        seen.push(handle.current);
      });
    });
    flushSync();
    handle.current = 4;
    flushSync();
    expect(seen).toEqual([1, 4]);
    cleanup();
  });
});
