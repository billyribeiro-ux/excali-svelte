import { createRawSnippet } from "svelte";
import { render, screen } from "@testing-library/svelte";
import { describe, expect, it } from "vitest";

import Card from "./Card.svelte";
import ButtonSeparator from "./ButtonSeparator.svelte";
import Ellipsify from "./Ellipsify.svelte";
import FixedSideContainer from "./FixedSideContainer.svelte";
import LinkButton from "./LinkButton.svelte";
import Paragraph from "./Paragraph.svelte";
import Spinner from "./Spinner.svelte";
import Stack from "./Stack.ts";

const child = createRawSnippet(() => ({ render: () => "<i>child</i>" }));

describe("Stack", () => {
  it("renders a horizontal stack with gap, align and justify", () => {
    const { container } = render(Stack.Row, {
      gap: 3,
      align: "center",
      justifyContent: "space-between",
      class: "extra",
      children: child,
    });
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveClass("Stack", "Stack_horizontal", "extra");
    expect(el.style.getPropertyValue("--gap")).toBe("3");
    expect(el.style.alignItems).toBe("center");
    expect(el.style.justifyContent).toBe("space-between");
    expect(el.querySelector("i")).toHaveTextContent("child");
  });

  it("renders a vertical stack using justify-items for align", () => {
    const { container } = render(Stack.Col, {
      align: "end",
      style: "color: red",
      children: child,
    });
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveClass("Stack", "Stack_vertical");
    expect(el.style.justifyItems).toBe("end");
    expect(el.style.alignItems).toBe("");
    expect(el.style.color).toBe("red");
  });

  it("lets the user style override the generated one", () => {
    const { container } = render(Stack.Row, {
      justifyContent: "center",
      style: "justify-content: space-around",
    });
    expect((container.firstElementChild as HTMLElement).style.justifyContent).toBe(
      "space-around",
    );
  });
});

describe("Card", () => {
  it("sets the card color custom properties", () => {
    const { container } = render(Card, { color: "lime", children: child });
    const el = container.querySelector(".Card") as HTMLElement;
    expect(el.style.getPropertyValue("--card-color")).toBe("#74b816");
    expect(el.style.getPropertyValue("--card-color-darker")).toBe("#66a80f");
    expect(el.style.getPropertyValue("--card-color-darkest")).toBe("#5c940d");
    expect(el).toHaveTextContent("child");
  });
});

describe("Spinner", () => {
  it("renders the circle with the given size and stroke width", () => {
    const { container } = render(Spinner, {
      size: 24,
      circleWidth: 10,
      class: "mine",
    });
    expect(container.querySelector(".Spinner")).toHaveClass("mine");
    const svg = container.querySelector("svg") as SVGElement;
    expect(svg.style.width).toBe("24px");
    expect(svg.style.height).toBe("24px");
    expect(svg.style.getPropertyValue("--spinner-delay")).toBe("0");
    const circle = container.querySelector("circle")!;
    expect(circle.getAttribute("r")).toBe("45");
    expect(circle.getAttribute("stroke-width")).toBe("10");
  });

  it("uses a negative delay when synchronized", () => {
    const { container } = render(Spinner, { synchronized: true });
    const svg = container.querySelector("svg") as SVGElement;
    expect(svg.style.getPropertyValue("--spinner-delay")).toMatch(/^-?\d+ms$/);
    expect(svg.style.width).toBe("1em");
  });
});

describe("Ellipsify / Paragraph / ButtonSeparator / FixedSideContainer", () => {
  it("Ellipsify truncates and merges the user style", () => {
    const { container } = render(Ellipsify, {
      style: "color: red",
      title: "t",
      children: child,
    });
    const el = container.querySelector("span") as HTMLElement;
    expect(el.style.textOverflow).toBe("ellipsis");
    expect(el.style.overflow).toBe("hidden");
    expect(el.style.whiteSpace).toBe("nowrap");
    expect(el.style.color).toBe("red");
    expect(el).toHaveAttribute("title", "t");
  });

  it("Paragraph renders the paragraph class", () => {
    const { container } = render(Paragraph, { style: "margin: 0", children: child });
    const p = container.querySelector("p") as HTMLElement;
    expect(p).toHaveClass("excalidraw__paragraph");
    expect(p.style.margin).toBe("0px");
  });

  it("ButtonSeparator renders a 1px separator", () => {
    const { container } = render(ButtonSeparator);
    const el = container.firstElementChild as HTMLElement;
    expect(el.style.width).toBe("1px");
    expect(el.style.height).toBe("1rem");
  });

  it("FixedSideContainer adds the side class", () => {
    const { container } = render(FixedSideContainer, {
      side: "left",
      class: "x",
      children: child,
    });
    expect(container.firstElementChild).toHaveClass(
      "FixedSideContainer",
      "FixedSideContainer_side_left",
      "x",
    );
  });
});

describe("LinkButton", () => {
  it("renders an external link wrapping a filled button", () => {
    render(LinkButton, { href: "https://example.com", children: child });
    const link = screen.getByRole("link");
    expect(link).toHaveAttribute("href", "https://example.com");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener");
    expect(link).toHaveClass("link-button");
    expect(link.querySelector("button.ExcButton")).toHaveTextContent("child");
  });
});
