import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";

import BraveMeasureTextError from "./BraveMeasureTextError.svelte";

describe("BraveMeasureTextError", () => {
  it("renders the four explanation paragraphs with bold text and links", () => {
    render(BraveMeasureTextError);
    const root = screen.getByTestId("brave-measure-text-error");
    expect(root.querySelectorAll("p")).toHaveLength(4);

    const bold = root.querySelectorAll("span[style*='font-weight']");
    expect(bold.length).toBeGreaterThan(0);
    expect((bold[0] as HTMLElement).style.fontWeight).toBe("600");
    expect(bold[0]).toHaveTextContent("Aggressively Block Fingerprinting");

    const links = Array.from(root.querySelectorAll("a")).map((a) =>
      a.getAttribute("href"),
    );
    expect(links).toEqual([
      "https://github.com/billyribeiro-ux/excali-svelte/blob/main/docs/faq.md#turning-off-aggressive-block-fingerprinting-in-brave-browser",
      "https://github.com/billyribeiro-ux/excali-svelte/issues/new",
    ]);
  });
});
