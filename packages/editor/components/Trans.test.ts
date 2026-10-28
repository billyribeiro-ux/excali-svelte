import { render } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import fallbackLangData from "../locales/en.json";

import TransHarness from "./TransHarness.test.svelte";
import { parseTransFormat } from "./Trans";

// Svelte emits empty comment anchors (`<!---->`) around blocks and snippets;
// they are not part of the rendered content being asserted.
const html = (el: HTMLElement) => el.innerHTML.replace(/<!---->/g, "");

describe("Test <Trans/>", () => {
  it("should translate the the strings correctly", () => {
    //@ts-ignore
    fallbackLangData.transTest = {
      key1: "Hello {{audience}}",
      key2: "Please <link>click the button</link> to continue.",
      key3: "Please <link>click {{location}}</link> to continue.",
      key4: "Please <link>click <bold>{{location}}</bold></link> to continue.",
      key5: "Please <connect-link>click the button</connect-link> to continue.",
    };

    const { getByTestId } = render(TransHarness);

    expect(html(getByTestId("test1"))).toEqual("Hello world");
    expect(html(getByTestId("test2"))).toEqual(
      `Please <a href="https://example.com">click the button</a> to continue.`,
    );
    expect(html(getByTestId("test3"))).toEqual(
      `Please <a href="https://example.com">click the button</a> to continue.`,
    );
    expect(html(getByTestId("test4"))).toEqual(
      `Please <a href="https://example.com">click <strong>the button</strong></a> to continue.`,
    );
    expect(html(getByTestId("test5"))).toEqual(
      `Please <a href="https://example.com">click the button</a> to continue.`,
    );
  });
});

describe("parseTransFormat", () => {
  it("builds a tree of text, keys and tags", () => {
    expect(
      parseTransFormat("a <b>x {{k}}</b> c", () => true),
    ).toEqual([
      { type: "text", text: "a " },
      {
        type: "tag",
        name: "b",
        children: [
          { type: "text", text: "x " },
          { type: "key", name: "k" },
        ],
      },
      { type: "text", text: " c" },
    ]);
  });

  it("warns and drops tags/keys that were not passed as props", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(parseTransFormat("hi <b>x</b> {{k}}", () => false)).toEqual([
      { type: "text", text: "hi " },
      { type: "text", text: "x" },
      { type: "text", text: " " },
    ]);
    // <b> missing, </b> unexpected, {{k}} missing
    expect(warn).toHaveBeenCalledTimes(3);
    warn.mockRestore();
  });

  it("warns when a tag is never closed", () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    parseTransFormat("<b>open", () => true);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("stack not empty"),
    );
    warn.mockRestore();
  });
});
