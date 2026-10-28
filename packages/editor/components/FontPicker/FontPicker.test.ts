import { fireEvent, render, waitFor } from "@testing-library/svelte";
import {
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { FONT_FAMILY } from "@svelte-draw/common";

import { createFakeEditorContext } from "../overlayTestUtils";

import FontPickerHarness from "./FontPickerHarness.test.svelte";

beforeAll(() => {
  (globalThis as any).ResizeObserver ||= class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const setup = (initialOpened: boolean) => {
  const { ctx } = createFakeEditorContext({
    app: {
      ownerWindow: window,
      ownerDocument: document,
      state: {},
      fonts: { getSceneFamilies: () => [] },
    } as any,
    props: { showDeprecatedFonts: false } as any,
    editorInterface: {
      formFactor: "desktop",
      desktopUIMode: "full",
      isLandscape: true,
      isTouchScreen: false,
    } as any,
  });
  const onTopPicksChange = vi.fn();
  const onSelect = vi.fn();
  const view = render(FontPickerHarness, {
    ctx,
    initialOpened,
    onTopPicksChange,
    onSelect,
  });
  return { ...view, onTopPicksChange, onSelect };
};

describe("FontPicker", () => {
  it("should be able to open font picker", async () => {
    const { queryByTestId } = setup(false);

    const fontPickerTrigger = queryByTestId("font-family-show-fonts");

    expect(fontPickerTrigger).not.toBeNull();
    expect(document.querySelector(".dropdown-menu.fonts")).toBeNull();

    await fireEvent.click(fontPickerTrigger!);

    await waitFor(() =>
      expect(document.querySelector(".dropdown-menu.fonts")).not.toBeNull(),
    );
  });

  describe("top picks drag & drop", () => {
    const SLOT_SIZE = 32;
    const SLOT_SPAN = 40;

    // jsdom has no layout — lay the strip slots out horizontally, and
    // everything else (the list rows) well below the strip
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
          return new DOMRect(0, 0, SLOT_SPAN * 2 + SLOT_SIZE, SLOT_SIZE);
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

    const getStripFamilies = (container: HTMLElement) =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          ".FontPicker__top-picks [data-top-pick-index]",
        ),
      ).map((button) => button.title);

    const openFontPicker = async () => {
      const utils = setup(true);
      await waitFor(() =>
        expect(
          document.querySelector('.dropdown-menu.fonts [title="Lilita One"]'),
        ).not.toBeNull(),
      );
      return utils;
    };

    it("pins a font dragged from the list, replacing the hovered slot", async () => {
      const { container, onTopPicksChange, onSelect } = await openFontPicker();

      const row = document.querySelector<HTMLElement>(
        '.dropdown-menu.fonts [title="Lilita One"]',
      )!;
      await drag(row, { clientX: 16, clientY: 316 }, slotCenter(1));

      await waitFor(() =>
        expect(onTopPicksChange).toHaveBeenLastCalledWith([
          FONT_FAMILY.Excalifont,
          FONT_FAMILY["Lilita One"],
          FONT_FAMILY["Comic Shanns"],
        ]),
      );
      await waitFor(() =>
        expect(getStripFamilies(container)).toEqual([
          "Hand-drawn",
          "Lilita One",
          "Code",
        ]),
      );
      // pinning doesn't pick the font
      expect(onSelect).not.toHaveBeenCalled();
    });

    it("refuses pinning an already pinned font", async () => {
      const { onTopPicksChange } = await openFontPicker();

      const row = document.querySelector<HTMLElement>(
        '.dropdown-menu.fonts [title="Nunito"]',
      )!;
      await drag(row, { clientX: 16, clientY: 316 }, slotCenter(0));

      expect(onTopPicksChange).not.toHaveBeenCalled();
    });

    it("reorders picks dragged within the strip", async () => {
      const { container, onTopPicksChange } = await openFontPicker();

      const firstPick = container.querySelector<HTMLElement>(
        '.FontPicker__top-picks [data-top-pick-index="0"]',
      )!;
      await drag(firstPick, slotCenter(0), slotCenter(2));

      await waitFor(() =>
        expect(onTopPicksChange).toHaveBeenLastCalledWith([
          FONT_FAMILY.Nunito,
          FONT_FAMILY["Comic Shanns"],
          FONT_FAMILY.Excalifont,
        ]),
      );
      await waitFor(() =>
        expect(getStripFamilies(container)).toEqual([
          "Normal",
          "Code",
          "Hand-drawn",
        ]),
      );
    });

    it("pads a short customized list with unpicked defaults", async () => {
      const { container, component, onTopPicksChange } = await openFontPicker();

      component.setTopPicks([FONT_FAMILY["Lilita One"]]);
      await waitFor(() =>
        expect(getStripFamilies(container)).toEqual([
          "Lilita One",
          "Hand-drawn",
          "Normal",
        ]),
      );

      // padded defaults count as pinned
      const row = document.querySelector<HTMLElement>(
        '.dropdown-menu.fonts [title="Nunito"]',
      )!;
      await drag(row, { clientX: 16, clientY: 316 }, slotCenter(0));
      expect(onTopPicksChange).not.toHaveBeenCalled();
      expect(component.getState().topPicks).toEqual([
        FONT_FAMILY["Lilita One"],
      ]);

      // dropping on a padded slot persists the full strip
      const code = document.querySelector<HTMLElement>(
        '.dropdown-menu.fonts [title="Comic Shanns"]',
      )!;
      await drag(code, { clientX: 16, clientY: 316 }, slotCenter(1));
      await waitFor(() =>
        expect(component.getState().topPicks).toEqual([
          FONT_FAMILY["Lilita One"],
          FONT_FAMILY["Comic Shanns"],
          FONT_FAMILY.Nunito,
        ]),
      );
    });

    it("resets customized picks from the tip's reset link", async () => {
      const { component, onTopPicksChange } = await openFontPicker();

      const getResetLink = () =>
        document.querySelector<HTMLElement>(
          ".FontPicker__tip .top-picks-dnd__tip-reset",
        );
      // nothing to reset while the picks are the defaults
      expect(getResetLink()).toBe(null);

      component.setTopPicks([FONT_FAMILY["Lilita One"], FONT_FAMILY.Nunito]);
      await waitFor(() => expect(getResetLink()).not.toBe(null));

      await fireEvent.click(getResetLink()!);

      expect(onTopPicksChange).toHaveBeenLastCalledWith(null);
      expect(component.getState().topPicks).toBe(null);
      // the popup stays open
      expect(component.getState().isOpened).toBe(true);
      await waitFor(() => expect(getResetLink()).toBe(null));
    });
  });
});
