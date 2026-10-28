import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { EDITOR_LS_KEYS } from "@svelte-draw/common";
import { newElement } from "@svelte-draw/element";

import { EditorLocalStorage } from "../data/EditorLocalStorage";
import { setEditorContext } from "../ui/editorContext";

import PublishLibrary from "./PublishLibrary.svelte";

import type { EditorContextValue } from "../ui/editorContext";
import type { LibraryItem } from "../types";

// the dialog shell (modal, focus handling) is covered by its own tests
vi.mock("./Dialog.svelte", () => ({
  default: ($$anchor: Comment, props: { children?: (a: Comment) => void }) =>
    props.children?.($$anchor),
}));
vi.mock("../scene/export", () => ({
  exportScene: vi.fn(async () =>
    document.createElementNS("http://www.w3.org/2000/svg", "svg"),
  ),
}));

const Wrapper = (...args: Parameters<typeof PublishLibrary>) => {
  setEditorContext({ container: null } as unknown as EditorContextValue);
  return PublishLibrary(...args);
};

const makeItem = (id: string, name?: string): LibraryItem => ({
  id,
  name,
  status: "unpublished",
  created: 0,
  elements: [newElement({ type: "rectangle", x: 0, y: 0 })],
});

const baseProps = () => ({
  onClose: vi.fn(),
  libraryItems: [makeItem("a", "alpha"), makeItem("b")],
  appState: { exportWithDarkMode: false } as any,
  onSuccess: vi.fn(),
  onError: vi.fn(),
  updateItemsInStorage: vi.fn(),
  onRemove: vi.fn(),
});

describe("PublishLibrary", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it("asks for at least one item when there is nothing to publish", () => {
    const { container } = render(Wrapper, { ...baseProps(), libraryItems: [] });
    expect(container.querySelector("form")).toBeNull();
    expect(container).toHaveTextContent("Please select at least one library item");
  });

  it("renders a form with one entry per item, prefilled names and fields", () => {
    const { container } = render(Wrapper, baseProps());
    expect(container.querySelectorAll(".single-library-item")).toHaveLength(2);
    const names = [
      ...container.querySelectorAll<HTMLInputElement>(
        ".single-library-item input",
      ),
    ].map((input) => input.value);
    expect(names).toEqual(["alpha", ""]);
    for (const name of [
      "name",
      "description",
      "authorName",
      "githubHandle",
      "twitterHandle",
      "website",
    ]) {
      expect(container.querySelector(`[name="${name}"]`)).not.toBeNull();
    }
    expect(container.querySelectorAll("a[target='_blank']").length).toBe(3);
  });

  it("restores saved form data from local storage", () => {
    EditorLocalStorage.set(EDITOR_LS_KEYS.PUBLISH_LIBRARY, {
      authorName: "Ann",
      githubHandle: "",
      name: "My lib",
      description: "desc",
      twitterHandle: "",
      website: "",
    });
    const { container } = render(Wrapper, baseProps());
    expect(
      container.querySelector<HTMLInputElement>('[name="authorName"]')!.value,
    ).toBe("Ann");
    expect(
      container.querySelector<HTMLInputElement>('[name="name"]')!.value,
    ).toBe("My lib");
  });

  it("flags items without a name on submit and does not call fetch", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch");
    const { container } = render(Wrapper, baseProps());
    await fireEvent.submit(container.querySelector("form")!);
    await waitFor(() =>
      expect(container.querySelectorAll(".single-library-item .error")).toHaveLength(2),
    );
    const errors = [
      ...container.querySelectorAll(".single-library-item .error"),
    ].map((el) => el.textContent);
    expect(errors).toEqual(["", "Required"]);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("removes via the item remove button", async () => {
    const props = baseProps();
    const { container } = render(Wrapper, props);
    await fireEvent.click(
      container.querySelectorAll<HTMLElement>(".single-library-item--remove")[1],
    );
    expect(props.onRemove).toHaveBeenCalledWith("b");
  });

  it("persists entered data and items when saving names", async () => {
    const props = baseProps();
    const { container } = render(Wrapper, props);
    await fireEvent.input(container.querySelector('[name="name"]')!, {
      target: { value: "Lib" },
    });
    await fireEvent.input(
      container.querySelectorAll<HTMLInputElement>(".single-library-item input")[1],
      { target: { value: "beta" } },
    );
    await fireEvent.click(screen.getByTestId("cancel-clear-canvas-button"));
    expect(props.updateItemsInStorage).toHaveBeenCalledTimes(1);
    expect(props.updateItemsInStorage.mock.calls[0][0].map((i: any) => i.name)).toEqual(
      ["alpha", "beta"],
    );
    expect(props.onClose).toHaveBeenCalledTimes(1);
    expect(
      EditorLocalStorage.get<{ name: string }>(EDITOR_LS_KEYS.PUBLISH_LIBRARY)!
        .name,
    ).toBe("Lib");
  });
});
