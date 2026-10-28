import fs from "fs";

// vitest.setup.ts
import "vitest-canvas-mock";
import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/dom";
import { cleanup } from "@testing-library/svelte";
import { plugins } from "@vitest/pretty-format";
import { afterEach, expect, vi } from "vitest";

import polyfill from "./packages/editor/polyfill";
import { mockThrottleRAF } from "./packages/editor/tests/helpers/mocks";
import { yellow } from "./packages/editor/tests/helpers/colorize";
import {
  PolyfillLocalStorage,
  testPolyfills,
} from "./packages/editor/tests/helpers/polyfills";

// Unmount rendered editors synchronously after each test (as React Testing
// Library's auto-cleanup did). Hooks run in parallel in this repo (see
// vitest.config.mts), so an async cleanup would let a test's own `afterEach`
// observe the still-mounted editor.
afterEach(() => {
  cleanup();
});

// Svelte renders `<!---->` anchor comments (and keeps whitespace text nodes)
// that React never emitted. DOM snapshots are taken of a copy without them, so
// the committed snapshots keep describing the actual elements, not the
// framework's bookkeeping nodes.
const SERIALIZED = Symbol("domSnapshotNormalized");
expect.addSnapshotSerializer({
  test: (value: unknown) =>
    typeof value === "object" &&
    value !== null &&
    (value as Node).nodeType === 1 &&
    !(value as any)[SERIALIZED],
  serialize: (value: Element, config, indentation, depth, refs, printer) => {
    const clone = value.cloneNode(true) as Element;
    const walker = clone.ownerDocument.createTreeWalker(
      clone,
      NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT,
    );
    const remove: Node[] = [];
    while (walker.nextNode()) {
      const node = walker.currentNode;
      if (
        // only Svelte's own anchors (`<!---->`, `<!--[-->`, `<!--]-->`, ...),
        // never real comments such as `<!-- svg-source:excalidraw -->`
        (node.nodeType === Node.COMMENT_NODE &&
          /^(|\[!?|\]|\[\d+)$/.test((node as Comment).data)) ||
        (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim())
      ) {
        remove.push(node);
      }
    }
    remove.forEach((node) => node.parentNode?.removeChild(node));
    (clone as any)[SERIALIZED] = true;
    return plugins.DOMElement.serialize(
      clone,
      config,
      indentation,
      depth,
      refs,
      printer,
    );
  },
});

Object.assign(globalThis, testPolyfills);
PolyfillLocalStorage();

// By default testing-library dumps the entire serialized DOM into the error
// message whenever a `waitFor`/`getBy*` fails, which floods the test output
// (often hundreds of lines of HTML per failure). Strip it out unless
// VITE_DEBUG_DOM is enabled (see .env.test), e.g. `VITE_DEBUG_DOM=true yarn test`.
const debugDom = ["true", "1"].includes(process.env.VITE_DEBUG_DOM ?? "");
if (!debugDom) {
  configure({
    getElementError: (message) => {
      const error = new Error(message ?? undefined);
      error.name = "TestingLibraryElementError";
      return error;
    },
  });
}

vi.mock("@svelte-draw/common", async (importOriginal) => {
  const module = await importOriginal<typeof import("@svelte-draw/common")>();

  return {
    ...module,
    throttleRAF: mockThrottleRAF,
  };
});

// mock for pep.js not working with setPointerCapture()
HTMLElement.prototype.setPointerCapture = vi.fn();

// eslint-disable-next-line @typescript-eslint/no-require-imports -- must load after the mocks above; a hoisted import would change ordering
require("fake-indexeddb/auto");

polyfill();

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

Object.defineProperty(window, "FontFace", {
  enumerable: true,
  value: class {
    private family: string;
    private source: string;
    private descriptors: any;
    private status: string;
    private unicodeRange: string;

    constructor(family, source, descriptors) {
      this.family = family;
      this.source = source;
      this.descriptors = descriptors;
      this.status = "unloaded";
      this.unicodeRange = "U+0000-00FF";
    }

    load() {
      this.status = "loaded";
    }
  },
});

Object.defineProperty(document, "fonts", {
  value: {
    load: vi.fn().mockResolvedValue([]),
    check: vi.fn().mockResolvedValue(true),
    has: vi.fn().mockResolvedValue(true),
    add: vi.fn(),
  },
});

Object.defineProperty(window, "EXCALIDRAW_ASSET_PATH", {
  value: `file://${__dirname}/`,
});

// mock the font fetch only, so that everything else, as font subsetting, can run inside of the (snapshot) tests
vi.mock(
  "./packages/editor/fonts/ExcalidrawFontFace",
  async (importOriginal) => {
    const mod = await importOriginal<
      typeof import("./packages/editor/fonts/ExcalidrawFontFace")
    >();
    const ExcalidrawFontFaceImpl = mod.ExcalidrawFontFace;

    return {
      ...mod,
      ExcalidrawFontFace: class extends ExcalidrawFontFaceImpl {
        public async fetchFont(url: URL): Promise<ArrayBuffer> {
          if (!url.toString().startsWith("file://")) {
            return super.fetchFont(url);
          }

          // read local assets directly, without running a server
          const content = await fs.promises.readFile(url);
          return content.buffer;
        }
      },
    };
  },
);

// ReactDOM is located inside index.tsx file
// as a result, we need a place for it to render into
const element = document.createElement("div");
element.id = "root";
document.body.appendChild(element);

const _consoleError = console.error.bind(console);
console.error = (...args) => {
  // the react's act() warning usually doesn't contain any useful stack trace
  // so we're catching the log and re-logging the message with the test name,
  // also stripping the actual component stack trace as it's not useful
  if (args[0]?.includes?.("act(")) {
    _consoleError(
      yellow(
        `<<< WARNING: test "${
          expect.getState().currentTestName
        }" does not wrap some state update in act() >>>`,
      ),
    );
  } else {
    _consoleError(...args);
  }
};
