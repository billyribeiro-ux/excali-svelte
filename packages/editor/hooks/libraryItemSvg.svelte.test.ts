import { flushSync } from "svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { editorJotaiStore } from "../editor-jotai";

import {
  createLibraryItemSvg,
  libraryItemSvgsCache,
  useLibraryCache,
} from "./libraryItemSvg.svelte";

import type { SvgCache } from "./libraryItemSvg.svelte";

const exportScene = vi.hoisted(() => vi.fn());
vi.mock("../scene/export", () => ({ exportScene }));

const makeSvg = (label: string) => {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("data-label", label);
  const fonts = document.createElementNS("http://www.w3.org/2000/svg", "style");
  fonts.setAttribute("class", "style-fonts");
  svg.appendChild(fonts);
  return svg as SVGSVGElement;
};

const settle = async () => {
  await vi.waitFor(() => {
    flushSync();
  });
  await Promise.resolve();
  await Promise.resolve();
  flushSync();
};

beforeEach(() => {
  exportScene.mockReset();
});

describe("createLibraryItemSvg", () => {
  it("exports an item, strips fonts, caches it by id and exposes the svg", async () => {
    exportScene.mockResolvedValue(makeSvg("a"));
    const svgCache: SvgCache = new Map();
    let item!: ReturnType<typeof createLibraryItemSvg>;
    const destroy = $effect.root(() => {
      item = createLibraryItemSvg(() => ({
        id: "id1",
        elements: [{ id: "e" }] as any,
        svgCache,
      }));
    });
    flushSync();
    expect(item.svg).toBeUndefined();
    await settle();

    expect(exportScene).toHaveBeenCalledTimes(1);
    expect(item.svg?.getAttribute("data-label")).toBe("a");
    expect(item.svg?.querySelector(".style-fonts")).toBeNull();
    expect(svgCache.get("id1")).toBe(item.svg);
    destroy();
  });

  it("uses the cached svg without exporting", () => {
    const cached = makeSvg("cached");
    const svgCache: SvgCache = new Map([["id1", cached]]);
    let item!: ReturnType<typeof createLibraryItemSvg>;
    const destroy = $effect.root(() => {
      item = createLibraryItemSvg(() => ({
        id: "id1",
        elements: [{ id: "e" }] as any,
        svgCache,
      }));
    });
    flushSync();
    expect(item.svg).toBe(cached);
    expect(exportScene).not.toHaveBeenCalled();
    destroy();
  });

  it("exports without caching when there is no id", async () => {
    exportScene.mockResolvedValue(makeSvg("noid"));
    const svgCache: SvgCache = new Map();
    let item!: ReturnType<typeof createLibraryItemSvg>;
    const destroy = $effect.root(() => {
      item = createLibraryItemSvg(() => ({
        id: null,
        elements: [{ id: "e" }] as any,
        svgCache,
      }));
    });
    flushSync();
    await settle();
    expect(item.svg?.getAttribute("data-label")).toBe("noid");
    expect(svgCache.size).toBe(0);
    destroy();
  });

  it("does nothing without elements", () => {
    let item!: ReturnType<typeof createLibraryItemSvg>;
    const destroy = $effect.root(() => {
      item = createLibraryItemSvg(() => ({
        id: "x",
        elements: undefined,
        svgCache: new Map(),
      }));
    });
    flushSync();
    expect(item.svg).toBeUndefined();
    expect(exportScene).not.toHaveBeenCalled();
    destroy();
  });

  it("renders the svg into the attached node and clears it on teardown", async () => {
    const cached = makeSvg("cached");
    const svgCache: SvgCache = new Map([["id1", cached]]);
    let item!: ReturnType<typeof createLibraryItemSvg>;
    const node = document.createElement("div");
    const destroy = $effect.root(() => {
      item = createLibraryItemSvg(() => ({
        id: "id1",
        elements: [{ id: "e" }] as any,
        svgCache,
      }));
    });
    flushSync();
    const teardown = item.attachment(node);
    expect(node.innerHTML).toBe(cached.outerHTML);
    (teardown as () => void)();
    expect(node.innerHTML).toBe("");
    destroy();
  });

  it("ignores a stale export that finishes after the input changed", async () => {
    let resolveFirst!: (svg: SVGSVGElement) => void;
    exportScene
      .mockImplementationOnce(() => new Promise((r) => (resolveFirst = r)))
      .mockResolvedValueOnce(makeSvg("second"));
    let id = $state<string | null>("one");
    const svgCache: SvgCache = new Map();
    let item!: ReturnType<typeof createLibraryItemSvg>;
    const destroy = $effect.root(() => {
      item = createLibraryItemSvg(() => ({
        id,
        elements: [{ id }] as any,
        svgCache,
      }));
    });
    flushSync();
    id = null;
    flushSync();
    await settle();
    resolveFirst(makeSvg("first"));
    await settle();
    expect(item.svg?.getAttribute("data-label")).toBe("second");
    destroy();
  });
});

describe("useLibraryCache", () => {
  it("clears and deletes entries of the shared cache", () => {
    const cache = editorJotaiStore.peek(libraryItemSvgsCache);
    cache.set("a", makeSvg("a"));
    cache.set("b", makeSvg("b"));
    const { svgCache, deleteItemsFromLibraryCache, clearLibraryCache } =
      useLibraryCache();
    expect(svgCache).toBe(cache);
    deleteItemsFromLibraryCache(["a"]);
    expect([...cache.keys()]).toEqual(["b"]);
    clearLibraryCache();
    expect(cache.size).toBe(0);
  });
});
