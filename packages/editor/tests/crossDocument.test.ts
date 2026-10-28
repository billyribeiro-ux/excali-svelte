import { waitFor } from "@testing-library/dom";
import { render as renderSvelte } from "@testing-library/svelte";
import { act, fireEvent } from "./test-utils";
import { vi } from "vitest";

import { FONT_FAMILY } from "@svelte-draw/common";

import type { FontFamilyValues } from "@svelte-draw/element/types";

import { SvelteDraw } from "../index";
import type { createColorTopPicksDnD } from "../components/ColorPicker/colorTopPicksDnD";

import CrossDocumentHarness from "./crossDocumentHarness.test.svelte";

import type { SvelteDrawAPI } from "../types";

const mountEditorInOwnDocument = (currentItemFontFamily?: FontFamilyValues) => {
  const iframe = document.createElement("iframe");
  document.body.append(iframe);

  const ownerDocument = iframe.contentDocument!;
  const ownerWindow = iframe.contentWindow! as Window & typeof globalThis;
  const mountNode = ownerDocument.createElement("div");
  ownerDocument.body.append(mountNode);

  const fonts = {
    load: vi.fn().mockResolvedValue([]),
    // pretend nothing is loaded yet, so that the editor actually goes
    // through `fonts.load()` for its scene & current item fonts
    check: vi.fn().mockReturnValue(false),
    has: vi.fn().mockReturnValue(true),
    add: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  Object.defineProperty(ownerDocument, "fonts", { value: fonts });
  Object.defineProperties(ownerWindow, {
    addEventListener: { value: vi.fn() },
    removeEventListener: { value: vi.fn() },
    requestAnimationFrame: {
      value: window.requestAnimationFrame.bind(window),
    },
    ResizeObserver: { value: window.ResizeObserver },
  });
  Object.defineProperty(ownerDocument, "defaultView", { value: ownerWindow });
  Object.defineProperty(ownerWindow.HTMLCanvasElement.prototype, "getContext", {
    value: window.HTMLCanvasElement.prototype.getContext,
  });

  let api: SvelteDrawAPI | null = null;
  const { container, unmount } = renderSvelte(
    SvelteDraw,
    {
      props: {
        ownerDocument: ownerDocument,
        initialData: {
          appState: currentItemFontFamily ? { currentItemFontFamily } : undefined,
        },
        onExcalidrawAPI: (nextApi) => {
          api = nextApi;
        },
      },
      target: mountNode,
    },
    { baseElement: ownerDocument.body },
  );

  return {
    fonts,
    container,
    getAPI: () => api,
    cleanup: () => {
      unmount();
      iframe.remove();
    },
  };
};

describe("cross-document rendering", () => {
  it("binds top-picks drag interactions to the source window", () => {
    const iframe = document.createElement("iframe");
    document.body.append(iframe);
    const ownerDocument = iframe.contentDocument!;
    const ownerWindow = iframe.contentWindow!;
    const mountNode = ownerDocument.createElement("div");
    ownerDocument.body.append(mountNode);
    const ownerAddEventListener = vi.fn();
    Object.defineProperties(ownerWindow, {
      addEventListener: { value: ownerAddEventListener },
      removeEventListener: { value: vi.fn() },
    });
    let startPickDrag:
      | ReturnType<typeof createColorTopPicksDnD>["startPickDrag"]
      | null = null;

    const renderResult = renderSvelte(
      CrossDocumentHarness,
      {
        target: mountNode,
        props: {
          onReady: (nextStartPickDrag) => {
            startPickDrag = nextStartPickDrag;
          },
        },
      },
      { baseElement: ownerDocument.body },
    );
    const mainAddEventListener = vi.spyOn(window, "addEventListener");

    try {
      const sourceEl = ownerDocument.querySelector<HTMLElement>(
        "[data-top-pick-index='0']",
      )!;
      act(() =>
        startPickDrag!(
          {
            button: 0,
            pointerId: 1,
            clientX: 0,
            clientY: 0,
            currentTarget: sourceEl,
          } as unknown as PointerEvent,
          0,
          "#000000",
        ),
      );

      for (const eventName of [
        "pointermove",
        "pointerup",
        "pointercancel",
        "keydown",
      ]) {
        expect(ownerAddEventListener).toHaveBeenCalledWith(
          eventName,
          expect.any(Function),
          true,
        );
        expect(mainAddEventListener).not.toHaveBeenCalledWith(
          eventName,
          expect.any(Function),
          true,
        );
      }
    } finally {
      renderResult.unmount();
      mainAddEventListener.mockRestore();
      iframe.remove();
    }
  });

  it("scopes listeners, fonts, and portals to ownerDocument", async () => {
    const iframe = document.createElement("iframe");
    document.body.append(iframe);

    const ownerDocument = iframe.contentDocument!;
    const ownerWindow = iframe.contentWindow! as Window & typeof globalThis;
    const mountNode = ownerDocument.createElement("div");
    ownerDocument.body.append(mountNode);

    const fonts = {
      load: vi.fn().mockResolvedValue([]),
      check: vi.fn().mockReturnValue(true),
      has: vi.fn().mockReturnValue(true),
      add: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(ownerDocument, "fonts", { value: fonts });
    const addEventListener = vi.fn();
    Object.defineProperties(ownerWindow, {
      addEventListener: { value: addEventListener },
      removeEventListener: { value: vi.fn() },
      requestAnimationFrame: {
        value: window.requestAnimationFrame.bind(window),
      },
      ResizeObserver: { value: window.ResizeObserver },
    });
    Object.defineProperty(ownerDocument, "defaultView", {
      value: ownerWindow,
    });
    Object.defineProperty(
      ownerWindow.HTMLCanvasElement.prototype,
      "getContext",
      {
        value: window.HTMLCanvasElement.prototype.getContext,
      },
    );
    const addDocumentEventListener = vi.spyOn(
      ownerDocument,
      "addEventListener",
    );
    let unmount: (() => void) | null = null;
    try {
      let api: SvelteDrawAPI | null = null;
      const renderResult = renderSvelte(
        SvelteDraw,
        {
          props: {
            ownerDocument: ownerDocument,
            handleKeyboardGlobally: true,
            onExcalidrawAPI: (nextApi) => {
              api = nextApi;
            },
          },
          target: mountNode,
        },
        { baseElement: ownerDocument.body },
      );
      unmount = renderResult.unmount;
      const { container } = renderResult;

      await waitFor(() =>
        expect(container.querySelector("canvas.interactive")).not.toBeNull(),
      );
      expect(api).not.toBeNull();
      await waitFor(() => expect(api!.getAppState().isLoading).toBe(false));
      expect(
        addDocumentEventListener.mock.calls.some(
          ([eventName]) => eventName === "pointermove",
        ),
      ).toBe(true);
      expect(
        addDocumentEventListener.mock.calls.some(
          ([eventName]) => eventName === "keydown",
        ),
      ).toBe(true);
      expect(
        addDocumentEventListener.mock.calls.some(
          ([eventName]) => eventName === "paste",
        ),
      ).toBe(true);
      expect(
        addEventListener.mock.calls.some(
          ([eventName]) => eventName === "message",
        ),
      ).toBe(true);
      const messageHandler = addEventListener.mock.calls.find(
        ([eventName]) => eventName === "message",
      )?.[1] as EventListener | undefined;
      expect(typeof messageHandler).toBe("function");
      expect(() =>
        messageHandler!(
          new ownerWindow.MessageEvent("message", {
            data: JSON.stringify({ method: "paused", value: true }),
            origin: "https://player.vimeo.com",
          }),
        ),
      ).not.toThrow();

      const excalidrawContainer = container.querySelector(".excalidraw")!;
      fireEvent.pointerEnter(excalidrawContainer);
      expect(ownerDocument.documentElement.style.overscrollBehaviorX).toBe(
        "none",
      );
      fireEvent.pointerLeave(excalidrawContainer);
      expect(ownerDocument.documentElement.style.overscrollBehaviorX).toBe(
        "auto",
      );

      expect(fonts.addEventListener).toHaveBeenCalledWith(
        "loadingdone",
        expect.any(Function),
        { passive: false },
      );

      ownerDocument.body.classList.add("excalidraw-animations-disabled");
      act(() => {
        api!.updateScene({
          appState: { openDialog: { name: "imageExport" } },
        });
      });

      await waitFor(() =>
        expect(
          ownerDocument.querySelector(".excalidraw-modal-container"),
        ).not.toBeNull(),
      );
      expect(document.querySelector(".excalidraw-modal-container")).toBeNull();
      // NOTE: not `toHaveClass()`: Svelte clones its templates through the
      // main window's `document`, so nodes inserted into the iframe keep the
      // main window's prototypes and fail jest-dom's
      // `instanceof ownerWindow.HTMLElement` guard (see report).
      expect(
        ownerDocument
          .querySelector(".Modal")!
          .classList.contains("animations-disabled"),
      ).toBe(true);
    } finally {
      unmount?.();
      iframe.remove();
    }
  });

  it("loads each editor's current item font through its own ownerDocument.fonts", async () => {
    const defaultFontEditor = mountEditorInOwnDocument();
    const nunitoEditor = mountEditorInOwnDocument(FONT_FAMILY.Nunito);

    try {
      for (const editor of [defaultFontEditor, nunitoEditor]) {
        await waitFor(() =>
          expect(
            editor.container.querySelector("canvas.interactive"),
          ).not.toBeNull(),
        );
        await waitFor(() =>
          expect(editor.getAPI()!.getAppState().isLoading).toBe(false),
        );
      }

      // each editor prewarms its own current item font (the default one
      // included) through its own document's font faces
      await waitFor(() =>
        expect(defaultFontEditor.fonts.load).toHaveBeenCalledWith(
          expect.stringContaining("Excalifont"),
          expect.stringContaining("Excalidr"),
        ),
      );
      await waitFor(() =>
        expect(nunitoEditor.fonts.load).toHaveBeenCalledWith(
          expect.stringContaining("Nunito"),
          expect.stringContaining("Excalidr"),
        ),
      );

      // ...and never through the other document's
      expect(defaultFontEditor.fonts.load).not.toHaveBeenCalledWith(
        expect.stringContaining("Nunito"),
        expect.anything(),
      );
      expect(nunitoEditor.fonts.load).not.toHaveBeenCalledWith(
        expect.stringContaining("Excalifont"),
        expect.anything(),
      );
    } finally {
      nunitoEditor.cleanup();
      defaultFontEditor.cleanup();
    }
  });
});
