import { newTextElement } from "@svelte-draw/element";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getMatchPreview, handleSearch, type SearchQuery } from "./SearchMenu";

const q = (s: string) => s as SearchQuery;

describe("getMatchPreview", () => {
  it("returns the whole text when it is short (characterizes the original double space before a complete word)", () => {
    expect(getMatchPreview("hello world", 6, q("world"))).toEqual({
      indexInSearchQuery: 7,
      previewText: "hello  world",
      moreBefore: false,
      moreAfter: false,
    });
  });

  it("truncates words before/after the match and flags more content", () => {
    const text = "one two three four five six seven eight nine ten eleven twelve";
    const index = text.indexOf("six");
    const preview = getMatchPreview(text, index, q("six"));
    expect(preview.moreBefore).toBe(true);
    expect(preview.moreAfter).toBe(true);
    expect(
      preview.previewText.slice(
        preview.indexInSearchQuery,
        preview.indexInSearchQuery + 3,
      ),
    ).toBe("six");
    expect(preview.previewText).not.toContain("one");
    expect(preview.previewText).not.toContain("twelve");
  });
});

describe("handleSearch", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  const makeApp = (elements: any[]) =>
    ({
      scene: { getNonDeletedElements: () => elements },
      renderEnvironment: undefined,
      state: { zoom: { value: 1 } },
      visibleElements: elements,
    } as any);

  it("calls back with no matches for an empty query (debounced)", () => {
    const cb = vi.fn();
    handleSearch(q(""), makeApp([]), cb);
    expect(cb).not.toHaveBeenCalled();
    vi.advanceTimersByTime(350);
    expect(cb).toHaveBeenCalledWith([], null);
  });

  it("finds case-insensitive text matches and the first visible index", () => {
    const text = newTextElement({ text: "Hello hello", x: 0, y: 0 });
    const cb = vi.fn();
    handleSearch(q("hello"), makeApp([text]), cb);
    vi.advanceTimersByTime(350);
    expect(cb).toHaveBeenCalledTimes(1);
    const [items, index] = cb.mock.calls[0];
    expect(items).toHaveLength(2);
    expect(items.map((i: any) => i.index)).toEqual([0, 6]);
    expect(index).toBe(0);
  });

  it("escapes regex special characters in the query", () => {
    const text = newTextElement({ text: "a.b a+b", x: 0, y: 0 });
    const cb = vi.fn();
    handleSearch(q("a.b"), makeApp([text]), cb);
    vi.advanceTimersByTime(350);
    expect(cb.mock.calls[0][0]).toHaveLength(1);
  });
});
