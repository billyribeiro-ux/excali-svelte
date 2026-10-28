import { fireEvent, render } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import { newElement } from "@svelte-draw/element";

import { actionToggleElementLock } from "../actions/actionElementLock";

import Harness from "./DialogContextHarness.test.svelte";
import UnlockPopup from "./UnlockPopup.svelte";

import type { EditorContextValue } from "../ui/editorContext";

const setup = (elements: ReturnType<typeof newElement>[]) => {
  const byId = new Map(elements.map((el) => [el.id, el]));
  const setAppState = vi.fn();
  const executeAction = vi.fn();
  const app = {
    scene: {
      getElement: (id: string) => byId.get(id) ?? null,
      getNonDeletedElementsMap: () => byId,
    },
    state: { selectedElementIds: {}, selectedGroupIds: {} },
  };
  const ctx = {
    app,
    elements,
    appState: {
      zoom: { value: 1 },
      scrollX: 0,
      scrollY: 0,
      offsetLeft: 10,
      offsetTop: 20,
      width: 800,
      height: 600,
    },
    setAppState,
    actionManager: { executeAction },
  } as unknown as EditorContextValue;
  return { ctx, app, setAppState, executeAction };
};

describe("UnlockPopup", () => {
  it("is positioned above the element and shows the unlock title", () => {
    const el = newElement({
      type: "rectangle",
      x: 100,
      y: 200,
      width: 50,
      height: 50,
    });
    const { ctx, app } = setup([el]);
    const { container } = render(Harness, {
      component: UnlockPopup,
      componentProps: { app, activeLockedId: el.id },
      ctx,
    });
    const popup = container.querySelector(".UnlockPopup") as HTMLElement;
    expect(popup).not.toBeNull();
    expect(popup.title).toBe("Unlock");
    // left = viewX - offsetLeft, bottom = height + 12 - viewY + offsetTop
    // (viewX = scene x + offsetLeft, viewY = scene y + offsetTop at zoom 1)
    expect(popup.style.left).toBe("100px");
    expect(popup.style.bottom).toBe("412px");
    expect(popup.querySelector("svg")).not.toBeNull();
  });

  it("renders nothing for an unknown id", () => {
    const { ctx, app } = setup([]);
    const { container } = render(Harness, {
      component: UnlockPopup,
      componentProps: { app, activeLockedId: "missing" },
      ctx,
    });
    expect(container.querySelector(".UnlockPopup")).toBeNull();
  });

  it("selects the element, clears activeLockedId and toggles the lock on click", async () => {
    const el = newElement({ type: "rectangle", x: 0, y: 0 });
    const { ctx, app, setAppState, executeAction } = setup([el]);
    const { container } = render(Harness, {
      component: UnlockPopup,
      componentProps: { app, activeLockedId: el.id },
      ctx,
    });
    await fireEvent.click(container.querySelector(".UnlockPopup")!);
    expect(setAppState).toHaveBeenCalledWith(
      expect.objectContaining({
        selectedElementIds: { [el.id]: true },
        activeLockedId: null,
      }),
    );
    expect(executeAction).toHaveBeenCalledWith(actionToggleElementLock);
  });
});
