import { createRawSnippet, tick } from "svelte";
import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import { checkIcon } from "./icons";

import Avatar from "./Avatar.svelte";
import ButtonIconCycle from "./ButtonIconCycle.svelte";
import CheckboxItem from "./CheckboxItem.svelte";
import DialogActionButton from "./DialogActionButton.svelte";
import LoadingMessage from "./LoadingMessage.svelte";
import MagicButton from "./MagicButton.svelte";
import QuickSearch from "./QuickSearch.svelte";
import RadioButton from "./RadioButton.svelte";
import RadioGroup from "./RadioGroup.svelte";
import RadioSelection from "./RadioSelection.svelte";
import Range from "./Range.svelte";
import ScrollableList from "./ScrollableList.svelte";
import Switch from "./Switch.svelte";

const child = createRawSnippet(() => ({ render: () => "<i>child</i>" }));

describe("Switch", () => {
  it("renders a checkbox with the toggled/disabled classes", () => {
    const { container } = render(Switch, {
      name: "sw",
      checked: true,
      title: "tt",
      onChange: () => {},
    });
    expect(container.querySelector(".Switch")).toHaveClass("toggled");
    const input = screen.getByRole("checkbox");
    expect(input).toBeChecked();
    expect(input).toHaveAttribute("id", "sw");
    expect(input).toHaveAttribute("name", "sw");
    expect(input).toHaveAttribute("title", "tt");
  });

  it("calls onChange with the inverted value and stays controlled", async () => {
    const onChange = vi.fn();
    render(Switch, { name: "sw", checked: false, onChange });
    const input = screen.getByRole("checkbox") as HTMLInputElement;
    await fireEvent.click(input);
    expect(onChange).toHaveBeenCalledWith(true);
    // the parent did not accept the change
    expect(input.checked).toBe(false);
  });

  it("toggles on Space keydown and honors disabled", async () => {
    const onChange = vi.fn();
    const { container } = render(Switch, {
      name: "sw",
      checked: true,
      onChange,
      disabled: true,
    });
    expect(container.querySelector(".Switch")).toHaveClass("disabled");
    const input = screen.getByRole("checkbox");
    expect(input).toBeDisabled();
    await fireEvent.keyDown(input, { key: " " });
    expect(onChange).toHaveBeenCalledWith(false);
  });
});

describe("Range", () => {
  it("renders progress, bubble and zero label", () => {
    const { container } = render(Range, {
      label: "Opacity",
      value: 50,
      onChange: () => {},
      testId: "r",
    });
    expect(container.querySelector("label")).toHaveClass("control-label");
    expect(
      (container.querySelector(".range-wrapper") as HTMLElement).style.getPropertyValue(
        "--range-progress",
      ),
    ).toBe("0.5");
    expect(container.querySelector(".value-bubble")).toHaveTextContent("50");
    expect(container.querySelector(".zero-label")).toHaveTextContent("0");
    expect(screen.getByTestId("r")).toHaveAttribute("type", "range");
  });

  it("hides the bubble at min, and marks non-common values", () => {
    const { container } = render(Range, {
      label: "x",
      value: 0,
      onChange: () => {},
      hasCommonValue: false,
      minLabel: "none",
    });
    expect(container.querySelector(".value-bubble")).toBeEmptyDOMElement();
    expect(container.querySelector(".zero-label")).toHaveTextContent("none");
    expect(
      (container.querySelector("input") as HTMLElement).style.getPropertyValue(
        "--color-slider-track",
      ),
    ).toBe("var(--button-bg)");
  });

  it("reports numeric changes", async () => {
    const onChange = vi.fn();
    render(Range, { label: "x", value: 10, onChange, testId: "r" });
    await fireEvent.input(screen.getByTestId("r"), { target: { value: "30" } });
    expect(onChange).toHaveBeenCalledWith(30);
  });
});

describe("RadioGroup", () => {
  it("renders choices, marks the active one and reports changes", async () => {
    const onChange = vi.fn();
    const { container } = render(RadioGroup, {
      name: "scale",
      value: 2,
      onChange,
      choices: [
        { value: 1, label: "1x", ariaLabel: "one" },
        { value: 2, label: "2x", ariaLabel: "two" },
      ],
    });
    const choices = container.querySelectorAll(".RadioGroup__choice");
    expect(choices).toHaveLength(2);
    expect(choices[1]).toHaveClass("active");
    expect(choices[0]).toHaveAttribute("title", "one");
    expect(choices[0]).toHaveTextContent("1x");
    expect(screen.getByLabelText("two")).toBeChecked();
    await fireEvent.click(screen.getByLabelText("one"));
    expect(onChange).toHaveBeenCalledWith(1);
  });
});

describe("RadioButton / RadioSelection", () => {
  it("RadioButton renders the title, test id and active class", async () => {
    const onclick = vi.fn();
    render(RadioButton, {
      icon: checkIcon,
      title: "pick",
      testId: "rb",
      active: true,
      class: "c",
      onclick,
    });
    const button = screen.getByTestId("rb");
    expect(button).toHaveAttribute("title", "pick");
    expect(button).toHaveAttribute("type", "button");
    expect(button).toHaveClass("c", "active");
    expect(button.querySelector("svg")).not.toBeNull();
    await fireEvent.click(button);
    expect(onclick).toHaveBeenCalledTimes(1);
  });

  it("RadioSelection (radio) renders labelled radio inputs", async () => {
    const a = { id: "a" };
    const b = { id: "b" };
    const onChange = vi.fn();
    const { container } = render(RadioSelection, {
      options: [
        { value: a, text: "A", icon: checkIcon, testId: "ta" },
        { value: b, text: "B", icon: checkIcon, testId: "tb" },
      ],
      value: b,
      group: "g",
      onChange,
    });
    const labels = container.querySelectorAll("label");
    expect(labels).toHaveLength(2);
    expect(labels[1]).toHaveClass("active");
    expect(labels[0]).toHaveAttribute("title", "A");
    expect(screen.getByTestId("tb")).toBeChecked();
    expect(screen.getByTestId("ta")).toHaveAttribute("name", "g");
    await fireEvent.click(screen.getByTestId("ta"));
    expect(onChange).toHaveBeenCalledWith(a);
  });

  it("RadioSelection (button) renders RadioButtons", async () => {
    const a = { id: "a" };
    const onClick = vi.fn();
    render(RadioSelection, {
      type: "button",
      options: [{ value: a, text: "A", icon: checkIcon, testId: "ta" }],
      value: a,
      onClick,
    });
    const button = screen.getByTestId("ta");
    expect(button).toHaveClass("active");
    await fireEvent.click(button);
    expect(onClick).toHaveBeenCalledWith(a, expect.any(MouseEvent));
  });
});

describe("CheckboxItem", () => {
  it("renders state, children and toggles by clicking anywhere on the row", async () => {
    const onChange = vi.fn();
    const { container } = render(CheckboxItem, {
      checked: false,
      onChange,
      class: "mine",
      children: child,
    });
    const row = container.querySelector(".Checkbox") as HTMLElement;
    expect(row).toHaveClass("mine");
    expect(row).not.toHaveClass("is-checked");
    const box = screen.getByRole("checkbox");
    expect(box).toHaveAttribute("aria-checked", "false");
    expect(container.querySelector(".Checkbox-label")).toHaveTextContent("child");
    await fireEvent.click(row.querySelector(".Checkbox-label")!);
    expect(onChange).toHaveBeenCalledWith(true, expect.any(MouseEvent));
    expect(document.activeElement).toBe(box);
  });

  it("reflects the checked state", () => {
    const { container } = render(CheckboxItem, { checked: true, onChange: () => {} });
    expect(container.querySelector(".Checkbox")).toHaveClass("is-checked");
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-checked", "true");
  });
});

describe("ButtonIconCycle", () => {
  it("cycles through the options", async () => {
    const onChange = vi.fn();
    const { container } = render(ButtonIconCycle, {
      options: [
        { value: null, text: "none", icon: checkIcon },
        { value: "a", text: "a", icon: checkIcon },
      ],
      value: null,
      onChange,
      group: "cycle",
    });
    const label = container.querySelector("label") as HTMLElement;
    expect(label).not.toHaveClass("active");
    await fireEvent.click(container.querySelector("input")!);
    expect(onChange).toHaveBeenCalledWith("a");
  });
});

describe("DialogActionButton", () => {
  it("renders label, type and action class", async () => {
    const onclick = vi.fn();
    render(DialogActionButton, {
      label: "Go",
      actionType: "danger",
      class: "x",
      onclick,
    });
    const button = screen.getByRole("button", { name: "Go" });
    expect(button).toHaveClass("Dialog__action-button", "Dialog__action-button--danger", "x");
    expect(button).toHaveAttribute("type", "button");
    await fireEvent.click(button);
    expect(onclick).toHaveBeenCalledTimes(1);
  });

  it("hides content and shows a spinner while loading", () => {
    const { container } = render(DialogActionButton, {
      label: "Go",
      isLoading: true,
      children: child,
    });
    const divs = container.querySelectorAll("button > div");
    expect((divs[0] as HTMLElement).style.visibility).toBe("hidden");
    expect((divs[1] as HTMLElement).style.visibility).toBe("hidden");
    expect(container.querySelector(".Spinner")).not.toBeNull();
  });
});

describe("QuickSearch", () => {
  it("normalizes the search term", async () => {
    const onChange = vi.fn();
    const { container } = render(QuickSearch, {
      placeholder: "Search",
      onChange,
      class: "q",
    });
    expect(container.querySelector(".QuickSearch__wrapper")).toHaveClass("q");
    expect(container.querySelector("svg")).not.toBeNull();
    const input = screen.getByPlaceholderText("Search");
    await fireEvent.input(input, { target: { value: "  FoO " } });
    expect(onChange).toHaveBeenCalledWith("foo");
  });
});

describe("ScrollableList", () => {
  it("renders children in a menu", () => {
    render(ScrollableList, { placeholder: "empty", class: "l", children: child });
    const menu = screen.getByRole("menu");
    expect(menu).toHaveClass("ScrollableList__wrapper", "l");
    expect(menu).toHaveTextContent("child");
  });

  it("renders the placeholder when empty", () => {
    render(ScrollableList, { placeholder: "empty", isEmpty: true, children: child });
    expect(screen.getByRole("menu")).toHaveTextContent("empty");
    expect(screen.getByRole("menu")).not.toHaveTextContent("child");
  });
});

describe("Avatar", () => {
  it("shows the initial on the user color without src", async () => {
    const onclick = vi.fn();
    const { container } = render(Avatar, { color: "rgb(255, 0, 0)", name: "alice", onclick });
    const el = container.querySelector(".Avatar") as HTMLElement;
    expect(el).toHaveTextContent("A");
    expect(el.style.background).toBe("rgb(255, 0, 0)");
    await fireEvent.click(el);
    expect(onclick).toHaveBeenCalledTimes(1);
  });

  it("falls back to the initial when the image fails to load", async () => {
    const { container } = render(Avatar, {
      color: "red",
      name: "bob",
      src: "https://example.com/x.png",
      onclick: () => {},
    });
    const img = container.querySelector("img.Avatar-img") as HTMLImageElement;
    expect(img).toHaveAttribute("referrerpolicy", "no-referrer");
    expect(img).toHaveAttribute("alt", "B");
    expect((container.querySelector(".Avatar") as HTMLElement).style.background).toBe("");
    await fireEvent.error(img);
    expect(container.querySelector("img")).toBeNull();
    expect(container.querySelector(".Avatar")).toHaveTextContent("B");
  });
});

describe("LoadingMessage", () => {
  it("renders immediately without a delay", () => {
    const { container } = render(LoadingMessage, { theme: "dark" });
    expect(container.querySelector(".LoadingMessage")).toHaveClass("LoadingMessage--dark");
    expect(container.querySelector(".Spinner")).not.toBeNull();
    expect(container.querySelector(".LoadingMessage-text")).not.toBeEmptyDOMElement();
  });

  it("waits for the delay before rendering", async () => {
    vi.useFakeTimers();
    try {
      const { container } = render(LoadingMessage, { delay: 100 });
      expect(container.querySelector(".LoadingMessage")).toBeNull();
      await vi.advanceTimersByTimeAsync(100);
      await tick();
      expect(container.querySelector(".LoadingMessage")).not.toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("MagicButton", () => {
  it("renders a small toggle that reports selection", async () => {
    const onChange = vi.fn();
    render(MagicButton, {
      title: "Magic",
      icon: checkIcon,
      checked: true,
      isMobile: true,
      onChange,
    });
    const button = screen.getByRole("button", { name: "Magic" });
    expect(button).toHaveClass(
      "ToolIcon__MagicButton",
      "is-mobile",
      "ToolIcon_type_toggle",
      "ToolIcon_size_small",
      "ToolIcon--checked",
    );
    expect(button).toHaveAttribute("aria-pressed", "true");
    await fireEvent.click(button);
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
