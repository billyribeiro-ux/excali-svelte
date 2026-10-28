import { createRawSnippet, tick } from "svelte";
import { render } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";

import EditorContextHarness from "../ui/EditorContextHarness.test.svelte";
import { createFakeEditorContext } from "../ui/testEditorContext";

import Section from "./Section.svelte";
import SectionHarness from "./SectionHarness.test.svelte";

const body = createRawSnippet(() => ({ render: () => "<span>body</span>" }));

const renderSection = async (props: Record<string, unknown>) => {
  const ctx = createFakeEditorContext();
  const result = render(EditorContextHarness, {
    props: { component: Section, ctx, props },
  });
  await tick();
  return result;
};

describe("Section", () => {
  it("renders a labelled section with a visually hidden heading then children", async () => {
    const { container } = await renderSection({
      heading: "shapes",
      class: "shapes-section",
      children: body,
    });
    const section = container.querySelector("section") as HTMLElement;
    expect(section).toHaveClass("shapes-section");
    expect(section).toHaveAttribute("aria-labelledby", "test-editor-shapes-title");
    const h2 = section.firstElementChild as HTMLElement;
    expect(h2.tagName).toBe("H2");
    expect(h2).toHaveClass("visually-hidden");
    expect(h2).toHaveAttribute("id", "test-editor-shapes-title");
    expect(h2).toHaveTextContent("Shapes");
    expect(section.querySelector("span")).toHaveTextContent("body");
  });

  it("lets the render-prop variant place the heading", async () => {
    const ctx = createFakeEditorContext();
    const { container } = render(SectionHarness, { props: { ctx } });
    await tick();
    const wrap = container.querySelector("section > .wrap") as HTMLElement;
    // heading is rendered where the snippet put it (after the marker), once
    expect(wrap.children[0].tagName).toBe("I");
    expect(wrap.children[1].tagName).toBe("H2");
    expect(container.querySelectorAll("h2")).toHaveLength(1);
  });
});
