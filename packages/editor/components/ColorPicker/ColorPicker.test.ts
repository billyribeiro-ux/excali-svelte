import { fireEvent, waitFor } from "@testing-library/svelte";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { COLOR_PALETTE, THEME } from "@svelte-draw/common";

import { getDefaultAppState } from "../../appState";
import { editorJotaiStore } from "../../editor-jotai";
import {
  createFakeEditorContext,
  renderWithEditorContext,
} from "../overlayTestUtils";

import ColorPicker from "./ColorPicker.svelte";
import { activeColorPickerSectionAtom } from "./colorPickerUtils";

import type { AppState } from "../../types";

beforeAll(() => {
  (globalThis as any).ResizeObserver ||= class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const setup = (
  props: Record<string, unknown> = {},
  appStateOverrides: Partial<AppState> = {},
) => {
  const fake = createFakeEditorContext({
    app: {
      ownerWindow: window,
      ownerDocument: document,
      state: {},
    } as any,
    editorInterface: {
      formFactor: "desktop",
      desktopUIMode: "full",
      isLandscape: true,
      isTouchScreen: false,
    } as any,
  });
  const updateData = vi.fn();
  const onChange = vi.fn();
  const baseProps = {
    type: "elementStroke" as const,
    color: "#1e1e1e",
    label: "Stroke",
    elements: [],
    appState: {
      ...getDefaultAppState(),
      theme: THEME.LIGHT,
      ...appStateOverrides,
    },
    updateData,
    onChange,
  };
  const view = renderWithEditorContext(
    ColorPicker,
    { ...baseProps, ...props } as any,
    fake.ctx,
  );
  return { ...view, updateData, onChange, baseProps };
};

describe("ColorPicker", () => {
  beforeEach(() => {
    editorJotaiStore.set(activeColorPickerSectionAtom, null);
  });

  it("renders the top picks and the trigger of the active color", () => {
    const { container } = setup();
    expect(
      container.querySelector(".color-picker__top-picks"),
    ).toBeInTheDocument();
    const trigger = container.querySelector<HTMLElement>(
      '[data-openpopup="elementStroke"]',
    )!;
    expect(trigger).toHaveAttribute("aria-label", "Stroke");
    expect(trigger).toHaveClass("active-color", "properties-trigger");
    expect(trigger.style.getPropertyValue("--swatch-color")).toBe("#1e1e1e");
  });

  it("picks a top pick color", async () => {
    const { container, onChange } = setup();
    const pick = container.querySelector<HTMLElement>(
      '[data-testid^="color-top-pick-"]',
    )!;
    await fireEvent.click(pick);
    expect(onChange).toHaveBeenCalledWith(
      pick.dataset.testid!.replace("color-top-pick-", ""),
    );
  });

  it("opens its popup through the trigger", async () => {
    const { container, updateData } = setup();
    await fireEvent.click(
      container.querySelector('[data-openpopup="elementStroke"]')!,
    );
    expect(updateData).toHaveBeenCalledWith({ openPopup: "elementStroke" });
  });

  it("toggles its popup off through the trigger when it is open", async () => {
    const { container, updateData } = setup({}, { openPopup: "elementStroke" });
    await fireEvent.click(
      container.querySelector('[data-openpopup="elementStroke"]')!,
    );
    expect(updateData).toHaveBeenCalledWith({ openPopup: null });
  });

  describe("popup", () => {
    const openPopup = async (props: Record<string, unknown> = {}) => {
      const utils = setup(props, { openPopup: "elementStroke" });
      await waitFor(() =>
        expect(
          document.querySelector(".color-picker-content"),
        ).toBeInTheDocument(),
      );
      return utils;
    };

    it("renders the palette, shades and the hex input", async () => {
      await openPopup({ color: COLOR_PALETTE.red[4] });
      expect(document.querySelector('[data-testid="color-red"]')).not.toBe(
        null,
      );
      expect(document.querySelector(".color-picker-content .shades")).not.toBe(
        null,
      );
      expect(document.querySelector(".color-picker-input")).not.toBe(null);
      expect(document.querySelector('[aria-label="Color picker"]')).not.toBe(
        null,
      );
    });

    it("picks a palette color on click", async () => {
      const { onChange } = await openPopup();
      await fireEvent.click(
        document.querySelector<HTMLElement>('[data-testid="color-red"]')!,
      );
      expect(onChange).toHaveBeenCalledTimes(1);
      expect(COLOR_PALETTE.red).toContain(onChange.mock.calls[0][0]);
    });

    it("picks a palette color with its hotkey", async () => {
      const { onChange } = await openPopup();
      const content = document.querySelector<HTMLElement>(
        ".color-picker-content",
      )!;
      await fireEvent.keyDown(content, { key: "q" });
      // `q` is the first palette entry, at the current shade
      expect(onChange).toHaveBeenCalledTimes(1);
    });

    it("closes explicitly on Escape", async () => {
      const { updateData } = await openPopup();
      const content = document.querySelector<HTMLElement>(
        ".color-picker-content",
      )!;
      await fireEvent.keyDown(content, { key: "Escape" });
      expect(updateData).toHaveBeenCalledWith({ openPopup: null });
    });

    it("hides excluded colors but keeps their grid position", async () => {
      await openPopup({ excludedColors: [COLOR_PALETTE.red[4]] });
      expect(document.querySelector('[data-testid="color-red"]')).toBe(null);
      const hidden = document.querySelector<HTMLElement>(
        '.color-picker-content--default [aria-hidden="true"]',
      );
      expect(hidden).not.toBe(null);
      expect(hidden!.style.visibility).toBe("hidden");
    });

    it("shows a hex input only when there is no palette", async () => {
      setup(
        { palette: null, type: "canvasBackground" },
        {
          openPopup: "canvasBackground",
        },
      );
      await waitFor(() =>
        expect(document.querySelector(".color-picker-input")).not.toBe(null),
      );
      expect(document.querySelector('[data-testid="color-red"]')).toBe(null);
    });
  });

  describe("customizable top picks", () => {
    const SLOT_SIZE = 32;
    const SLOT_SPAN = 40;

    beforeEach(() => {
      vi.spyOn(
        HTMLElement.prototype,
        "getBoundingClientRect",
      ).mockImplementation(function (this: HTMLElement) {
        const index = this.dataset.topPickIndex;
        if (index != null) {
          return new DOMRect(
            Number(index) * SLOT_SPAN,
            0,
            SLOT_SIZE,
            SLOT_SIZE,
          );
        }
        if (this.classList.contains("top-picks-dnd")) {
          return new DOMRect(0, 0, SLOT_SPAN * 4 + SLOT_SIZE, SLOT_SIZE);
        }
        return new DOMRect(0, 300, SLOT_SIZE, SLOT_SIZE);
      });
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    const slotCenter = (index: number) => ({
      clientX: index * SLOT_SPAN + SLOT_SIZE / 2,
      clientY: SLOT_SIZE / 2,
    });

    const drag = async (
      source: HTMLElement,
      from: { clientX: number; clientY: number },
      to: { clientX: number; clientY: number },
    ) => {
      await fireEvent.pointerDown(source, {
        pointerId: 1,
        button: 0,
        ...from,
      });
      // wait out the sloppy-click grace period
      await new Promise((resolve) => setTimeout(resolve, 120));
      await fireEvent.pointerMove(window, { pointerId: 1, ...to });
      await fireEvent.pointerUp(window, { pointerId: 1, ...to });
      // let the post-drop click suppression lapse
      await new Promise((resolve) => setTimeout(resolve, 120));
    };

    it("reorders picks dragged within the strip", async () => {
      const { container, updateData } = setup({
        customizableTopPicks: "elementStroke",
      });
      const picks = Array.from(
        container.querySelectorAll<HTMLElement>(
          ".color-picker__top-picks [data-top-pick-index]",
        ),
      ).map((el) => el.dataset.testid!.replace("color-top-pick-", ""));

      await drag(
        container.querySelector<HTMLElement>('[data-top-pick-index="0"]')!,
        slotCenter(0),
        slotCenter(2),
      );

      await waitFor(() => expect(updateData).toHaveBeenCalledTimes(1));
      const next = [...picks];
      const [moved] = next.splice(0, 1);
      next.splice(2, 0, moved);
      expect(updateData).toHaveBeenCalledWith({
        colorTopPicks: expect.objectContaining({ elementStroke: next }),
      });
    });

    it("pins a palette color dragged onto the strip", async () => {
      const { container, updateData } = setup(
        { customizableTopPicks: "elementStroke" },
        { openPopup: "elementStroke" },
      );
      await waitFor(() =>
        expect(document.querySelector('[data-testid="color-red"]')).not.toBe(
          null,
        ),
      );
      const cyanButton = document.querySelector<HTMLElement>(
        '[data-testid="color-cyan"]',
      )!;
      await drag(cyanButton, { clientX: 16, clientY: 316 }, slotCenter(1));

      await waitFor(() => expect(updateData).toHaveBeenCalledTimes(1));
      const [{ colorTopPicks }] = updateData.mock.calls[0];
      expect(colorTopPicks.elementStroke).toHaveLength(
        container.querySelectorAll(
          ".color-picker__top-picks [data-top-pick-index]",
        ).length,
      );
      expect(colorTopPicks.elementStroke[1]).toBe(COLOR_PALETTE.cyan[4]);
    });

    it("does not allow dragging when not customizable", async () => {
      const { container, updateData } = setup();
      await drag(
        container.querySelector<HTMLElement>('[data-top-pick-index="0"]')!,
        slotCenter(0),
        slotCenter(2),
      );
      expect(updateData).not.toHaveBeenCalled();
    });
  });
});
