import { newTextElement } from "@svelte-draw/element";
import { fireEvent, render } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import { getDefaultAppState } from "../../appState";

import Harness from "./HyperlinkHarness.test.svelte";

const setup = (
  link: string | null,
  showHyperlinkPopup: "info" | "editor" | false,
  onLinkOpen?: any,
) => {
  const element = newTextElement({ text: "a", x: 0, y: 0 });
  (element as any).link = link;
  const mutateElement = vi.fn((el: any, update: any) => Object.assign(el, update));
  const setAppState = vi.fn();
  const appState = { ...getDefaultAppState(), offsetLeft: 0, offsetTop: 0, showHyperlinkPopup };
  const ctx = {
    app: { ownerWindow: window },
    props: {},
    appState,
    elements: [element],
    editorInterface: { formFactor: "desktop", isTouchScreen: false },
    setAppState,
  } as any;
  const scene = {
    getNonDeletedElementsMap: () => new Map([[element.id, element]]),
    mutateElement,
  };
  const utils = render(Harness, {
    ctx,
    hyperlinkProps: {
      element,
      scene,
      setAppState,
      onLinkOpen,
      setToast: vi.fn(),
      updateEmbedValidationStatus: vi.fn(),
    },
  });
  return { ...utils, element, mutateElement, setAppState };
};

describe("Hyperlink", () => {
  it("renders the link, positioned popup and edit/link/remove buttons", () => {
    const { container } = setup("https://x.test", "info");
    const popup = container.querySelector<HTMLElement>(
      ".excalidraw-hyperlinkContainer",
    )!;
    expect(popup.style.width).toBe("380px");
    const a = container.querySelector("a.excalidraw-hyperlinkContainer-link")!;
    expect(a).toHaveAttribute("href", "https://x.test");
    expect(a).toHaveAttribute("target", "_blank");
    expect(a).toHaveAttribute("rel", "noopener noreferrer");
    expect(container.querySelector(".excalidraw-hyperlinkContainer--edit")).not.toBeNull();
    expect(container.querySelector(".excalidraw-hyperlinkContainer--remove")).not.toBeNull();
  });

  it("shows the empty label and no remove button without a link", () => {
    const { container } = setup(null, "info");
    expect(
      container.querySelector("div.excalidraw-hyperlinkContainer-link"),
    ).toHaveTextContent("No link is set");
    expect(container.querySelector(".excalidraw-hyperlinkContainer--remove")).toBeNull();
  });

  it("edit button switches to the editor", async () => {
    const { container, setAppState } = setup("https://x.test", "info");
    await fireEvent.click(
      container.querySelector(".excalidraw-hyperlinkContainer--edit")!,
    );
    expect(setAppState).toHaveBeenCalledWith({ showHyperlinkPopup: "editor" });
  });

  it("remove clears the link and closes the popup", async () => {
    const { container, mutateElement, setAppState, element } = setup(
      "https://x.test",
      "info",
    );
    await fireEvent.click(
      container.querySelector(".excalidraw-hyperlinkContainer--remove")!,
    );
    expect(mutateElement).toHaveBeenCalledWith(element, { link: null });
    expect(setAppState).toHaveBeenCalledWith({ showHyperlinkPopup: false });
  });

  it("onLinkOpen can prevent the default navigation", async () => {
    const onLinkOpen = vi.fn((_el, event) => event.preventDefault());
    const { container } = setup("https://x.test", "info", onLinkOpen);
    const a = container.querySelector("a")!;
    const notPrevented = await fireEvent.click(a);
    expect(onLinkOpen).toHaveBeenCalledTimes(1);
    expect(onLinkOpen.mock.calls[0][0].link).toBe("https://x.test");
    expect(notPrevented).toBe(false);
  });

  it("editor: Enter submits the trimmed link and returns to info", async () => {
    const { container, mutateElement, setAppState, element } = setup(
      null,
      "editor",
    );
    const input = container.querySelector("input")!;
    expect(input).toHaveAttribute("placeholder", "Type or paste your link here");
    await fireEvent.input(input, { target: { value: "  example.com " } });
    await fireEvent.keyDown(input, { key: "Enter" });
    expect(mutateElement).toHaveBeenCalledWith(element, {
      link: "example.com",
    });
    expect(setAppState).toHaveBeenCalledWith({ showHyperlinkPopup: "info" });
  });

  it("editor: submits pending input on unmount", async () => {
    const { container, mutateElement, element, unmount } = setup(null, "editor");
    await fireEvent.input(container.querySelector("input")!, {
      target: { value: "https://pending.test" },
    });
    unmount();
    expect(mutateElement).toHaveBeenCalledWith(element, {
      link: "https://pending.test",
    });
  });
});
