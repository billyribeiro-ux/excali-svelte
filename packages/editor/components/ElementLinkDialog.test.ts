import { fireEvent, render, screen } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import ElementLinkDialog from "./ElementLinkDialog.svelte";

const setup = (link: string | null, appStateOverrides: object = {}) => {
  const element = { id: "el1", link } as any;
  const elementsMap = new Map([[element.id, element]]);
  const scene = {
    getNonDeletedElementsMap: () => elementsMap,
    mutateElement: vi.fn(),
  } as any;
  const onClose = vi.fn();
  const appState = {
    selectedElementIds: {},
    openDialog: { name: "elementLinkSelector" },
    ...appStateOverrides,
  } as any;
  render(ElementLinkDialog, {
    sourceElementId: element.id,
    appState,
    scene,
    onClose,
    generateLinkForSelection: undefined,
  });
  return { element, scene, onClose };
};

describe("ElementLinkDialog", () => {
  it("shows the existing link and a remove button", () => {
    setup("https://example.com");
    expect(screen.getByRole("textbox")).toHaveValue("https://example.com");
    expect(screen.getByLabelText("Remove")).toBeInTheDocument();
  });

  it("does not show the remove button without a link", () => {
    setup(null);
    expect(screen.queryByLabelText("Remove")).toBeNull();
  });

  it("saves an edited link on confirm and closes", async () => {
    const { element, scene, onClose } = setup(null);
    const input = screen.getByRole("textbox") as HTMLInputElement;
    await fireEvent.input(input, { target: { value: "https://new.link" } });
    await fireEvent.click(screen.getByLabelText("Confirm"));
    expect(scene.mutateElement).toHaveBeenCalledWith(element, {
      link: "https://new.link",
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("removes the link from the element when cleared via the remove button", async () => {
    const { element, scene, onClose } = setup("https://example.com");
    await fireEvent.click(screen.getByLabelText("Remove"));
    expect(screen.getByRole("textbox")).toHaveValue("");
    // the element is untouched until confirmed
    expect(scene.mutateElement).not.toHaveBeenCalled();
    await fireEvent.click(screen.getByLabelText("Confirm"));
    expect(scene.mutateElement).toHaveBeenCalledWith(element, { link: null });
    expect(onClose).toHaveBeenCalled();
  });

  it("cancel and Escape close without mutating", async () => {
    const { scene, onClose } = setup("https://example.com");
    await fireEvent.click(screen.getByLabelText("Cancel"));
    expect(onClose).toHaveBeenCalledTimes(1);
    await fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).toHaveBeenCalledTimes(2);
    expect(scene.mutateElement).not.toHaveBeenCalled();
  });

  it("ignores window Enter/Escape when the dialog is not the open dialog", async () => {
    const { onClose } = setup("https://example.com", { openDialog: null });
    await fireEvent.keyDown(window, { key: "Escape" });
    expect(onClose).not.toHaveBeenCalled();
  });
});
