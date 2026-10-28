import "pepjs";
import * as dom from "@testing-library/dom";
import { queries, waitFor } from "@testing-library/dom";
import { cleanup, render } from "@testing-library/svelte";
import { flushSync as flushSvelte } from "svelte";
import ansi from "ansicolor";
import { vi } from "vitest";

import { ORIG_ID, arrayToMap } from "@svelte-draw/common";

import { getSelectedElements } from "@svelte-draw/element";

import type { ExcalidrawElement } from "@svelte-draw/element/types";

import type { AllPossibleKeys } from "@svelte-draw/common/utility-types";

import { STORAGE_KEYS } from "../../../svelte-draw-app/src/lib/app/app_constants";

import { Pointer, UI } from "./helpers/ui";
import * as toolQueries from "./queries/toolQueries";

import { flushSync as flushEditor } from "../editor/Editor";

import type { History } from "../history";

import type { ImportedDataState } from "../data/types";
import type { Component, ComponentProps } from "svelte";

export { cleanup as unmountComponent };

// React Testing Library's `waitFor` always yields one macrotask after the
// awaited condition holds ("drain microtask queue", @testing-library/react
// pure.js `asyncWrapper`). Editor code defers work with `setTimeout(0)` (e.g.
// the text editor focusing its textarea), and tests rely on it having run once
// `await waitFor(...)`/`await getTextEditor()` resolve. Keep that contract.
dom.configure({
  asyncWrapper: async (cb) => {
    const result = await cb();
    // a faked `setTimeout` would never fire on its own
    if (!vi.isFakeTimers()) {
      await new Promise<void>((resolve) => setTimeout(resolve, 0));
    }
    return result;
  },
});

const customQueries = {
  ...queries,
  ...toolQueries,
};

/**
 * Commits whatever the editor has queued (its React-style batched `setState`)
 * and applies the resulting view update to the DOM — what React Testing
 * Library's `act()` used to do implicitly after every interaction.
 */
const flushAll = () => {
  // a Svelte effect may itself queue editor updates (e.g. a panel forwarding
  // batched data to an action, as React's useEffect did), which in turn
  // re-render the view: alternate until both sides are settled
  for (let pass = 0; pass < 4; pass++) {
    flushEditor();
    try {
      flushSvelte();
    } catch (error) {
      // called from inside an effect: Svelte flushes right after it on its own
      if (
        !(error instanceof Error && /flush_sync_in_effect/.test(error.message))
      ) {
        throw error;
      }
      return;
    }
  }
};

/** synchronous `act`: runs `cb`, then flushes editor + DOM updates */
export const act = <T>(cb: () => T | Promise<T>): T | Promise<T> => {
  let result: T | Promise<T>;
  flushEditor(() => {
    result = cb();
  });
  flushAll();
  if (result! instanceof Promise) {
    return result.then(async (value) => {
      await Promise.resolve();
      flushAll();
      return value;
    });
  }
  return result!;
};

type FireEvent = typeof dom.fireEvent;

/** `fireEvent` that flushes the editor's queued updates after dispatching */
export const fireEvent: FireEvent = new Proxy(dom.fireEvent, {
  apply(target, thisArg, args) {
    const result = Reflect.apply(target, thisArg, args);
    flushAll();
    return result;
  },
  get(target, property, receiver) {
    const value = Reflect.get(target, property, receiver);
    if (typeof value !== "function") {
      return value;
    }
    return (...args: unknown[]) => {
      const result = value.apply(target, args);
      // React's `onChange` fires for both the native `input` and `change`
      // events of text-like inputs (e.g. range sliders); Svelte handlers bind
      // the native `input` event, so mirror that for `fireEvent.change`.
      if (property === "change") {
        const el = args[0];
        if (
          el instanceof HTMLInputElement &&
          !["checkbox", "radio", "file"].includes(el.type)
        ) {
          dom.fireEvent.input(el);
        }
      }
      flushAll();
      return result;
    };
  },
});

type TestRenderOptions<C extends Component<any>> = {
  props?: ComponentProps<C>;
  localStorageData?: ImportedDataState;
};

const renderApp = async <C extends Component<any>>(
  component: C,
  options?: TestRenderOptions<C>,
) => {
  // when tests reuse Pointer instances let's reset the last
  // pointer poisitions so there's no leak between tests
  Pointer.resetAll();

  if (options?.localStorageData) {
    initLocalStorage(options.localStorageData);
  }

  const renderResult = render(
    component as any,
    { props: options?.props ?? ({} as ComponentProps<C>) },
    { queries: customQueries },
  );

  // React Testing Library's `rerender(<SvelteDraw ...props/>)` REPLACES the
  // props (omitted ones go back to undefined) and is wrapped in `act()`, so
  // tests don't await it. Svelte's `rerender` merges into the previous props
  // and applies the effects in a microtask: replace semantics + flush here.
  const originalRerender = renderResult.rerender;
  let currentProps: Record<string, unknown> = {
    ...(options?.props as Record<string, unknown>),
  };
  renderResult.rerender = ((nextProps: Record<string, unknown>) => {
    const merged: Record<string, unknown> = { ...nextProps };
    for (const key of Object.keys(currentProps)) {
      if (!(key in merged)) {
        merged[key] = undefined;
      }
    }
    currentProps = { ...nextProps };
    const pending = originalRerender(merged as any);
    flushAll();
    return pending;
  }) as typeof originalRerender;

  GlobalTestState.renderResult = renderResult;

  Object.defineProperty(GlobalTestState, "canvas", {
    // must be a getter because at the time of ExcalidrawApp render the
    // child App component isn't likely mounted yet (and thus canvas not
    // present in DOM)
    get() {
      return renderResult.container.querySelector("canvas.static")!;
    },
  });

  Object.defineProperty(GlobalTestState, "interactiveCanvas", {
    // must be a getter because at the time of ExcalidrawApp render the
    // child App component isn't likely mounted yet (and thus canvas not
    // present in DOM)
    get() {
      return renderResult.container.querySelector("canvas.interactive")!;
    },
  });

  await waitFor(() => {
    const canvas = renderResult.container.querySelector("canvas.static");
    if (!canvas) {
      throw new Error("not initialized yet");
    }

    const interactiveCanvas =
      renderResult.container.querySelector("canvas.interactive");
    if (!interactiveCanvas) {
      throw new Error("not initialized yet");
    }

    // hack-awaiting app.initialScene() which solves some test race conditions
    // (later we may switch this with proper event listener)
    if (window.h.state.isLoading) {
      throw new Error("still loading");
    }
  });

  return renderResult;
};

// re-export the DOM testing utilities (`act` and `fireEvent` are our own,
// above, since the editor commits updates in microtasks)
export * from "@testing-library/dom";
export { cleanup } from "@testing-library/svelte";

// override render method
export { renderApp as render };

/**
 * For state-sharing across test helpers.
 * NOTE: there shouldn't be concurrency issues as each test is running in its
 *  own process and thus gets its own instance of this module when running
 *  tests in parallel.
 */
export class GlobalTestState {
  /**
   * automatically updated on each call to render()
   */
  static renderResult: Awaited<ReturnType<typeof renderApp>> = null!;
  /**
   * retrieves static canvas for currently rendered app instance
   */
  static get canvas(): HTMLCanvasElement {
    return null!;
  }
  /**
   * retrieves interactive canvas for currently rendered app instance
   */
  static get interactiveCanvas(): HTMLCanvasElement {
    return null!;
  }
}

const initLocalStorage = (data: ImportedDataState) => {
  if (data.elements) {
    localStorage.setItem(
      STORAGE_KEYS.LOCAL_STORAGE_ELEMENTS,
      JSON.stringify(data.elements),
    );
  }
  if (data.appState) {
    localStorage.setItem(
      STORAGE_KEYS.LOCAL_STORAGE_APP_STATE,
      JSON.stringify(data.appState),
    );
  }
};

const originalGetBoundingClientRect =
  global.window.HTMLDivElement.prototype.getBoundingClientRect;

export const mockBoundingClientRect = (
  {
    top = 0,
    left = 0,
    bottom = 0,
    right = 0,
    width = 1920,
    height = 1080,
    x = 0,
    y = 0,
    toJSON = () => {},
  } = {
    top: 10,
    left: 20,
    bottom: 10,
    right: 10,
    width: 200,
    x: 10,
    y: 20,
    height: 100,
  },
) => {
  // override getBoundingClientRect as by default it will always return all values as 0 even if customized in html
  global.window.HTMLDivElement.prototype.getBoundingClientRect = () => ({
    top,
    left,
    bottom,
    right,
    width,
    height,
    x,
    y,
    toJSON,
  });
};

export const withExcalidrawDimensions = async (
  dimensions: { width: number; height: number },
  cb: () => void,
) => {
  const { h } = window;

  mockBoundingClientRect(dimensions);
  act(() => {
    h.app.refreshEditorInterface();
    h.app.refresh();
  });

  await cb();

  restoreOriginalGetBoundingClientRect();
  act(() => {
    h.app.refreshEditorInterface();
    h.app.refresh();
  });
};

export const restoreOriginalGetBoundingClientRect = () => {
  global.window.HTMLDivElement.prototype.getBoundingClientRect =
    originalGetBoundingClientRect;
};

export const assertSelectedElements = (
  ...elements: (
    | (ExcalidrawElement["id"] | ExcalidrawElement)[]
    | ExcalidrawElement["id"]
    | ExcalidrawElement
  )[]
) => {
  const { h } = window;
  const selectedElementIds = getSelectedElements(
    h.app.getSceneElements(),
    h.state,
  ).map((el) => el.id);
  const ids = elements
    .flat()
    .map((item) => (typeof item === "string" ? item : item.id));
  expect(selectedElementIds.length).toBe(ids.length);
  expect(selectedElementIds).toEqual(expect.arrayContaining(ids));
};

export const toggleMenu = (container: HTMLElement) => {
  // open menu
  fireEvent.click(container.querySelector(".dropdown-menu-button")!);
};

export const togglePopover = (label: string) => {
  // Needed for popover primitives as tests fail due to resize observer not being present
  (global as any).ResizeObserver = class ResizeObserver {
    constructor(cb: any) {
      (this as any).cb = cb;
    }

    observe() {}

    unobserve() {}
    disconnect() {}
  };

  UI.clickLabeledElement(label);
};

expect.extend({
  toBeNonNaNNumber(received) {
    const pass = typeof received === "number" && !isNaN(received);
    if (pass) {
      return {
        message: () => `expected ${received} not to be a non-NaN number`,
        pass: true,
      };
    }
    return {
      message: () => `expected ${received} to be a non-NaN number`,
      pass: false,
    };
  },
});

/**
 * Serializer for IEE754 float pointing numbers to avoid random failures due to tiny precision differences
 */
expect.addSnapshotSerializer({
  serialize(val, config, indentation, depth, refs, printer) {
    return printer(val.toFixed(5), config, indentation, depth, refs);
  },
  test(val) {
    return (
      typeof val === "number" &&
      Number.isFinite(val) &&
      !Number.isNaN(val) &&
      !Number.isInteger(val)
    );
  },
});

export const getCloneByOrigId = <T extends boolean = false>(
  origId: ExcalidrawElement["id"],
  returnNullIfNotExists: T = false as T,
): T extends true ? ExcalidrawElement | null : ExcalidrawElement => {
  const clonedElement = window.h.elements?.find(
    (el) => (el as any)[ORIG_ID] === origId,
  );
  if (clonedElement) {
    return clonedElement;
  }
  if (returnNullIfNotExists !== true) {
    throw new Error(`cloned element not found for origId: ${origId}`);
  }
  return null as T extends true ? ExcalidrawElement | null : ExcalidrawElement;
};

/**
 * Assertion helper that strips the actual elements of extra attributes
 * so that diffs are easier to read in case of failure.
 *
 * Asserts element order as well, and selected element ids
 * (when `selected: true` set for given element).
 *
 * If testing cloned elements, you can use { `[ORIG_ID]: origElement.id }
 * If you need to refer to cloned element properties, you can use
 * `getCloneByOrigId()`, e.g.: `{ frameId: getCloneByOrigId(origFrame.id)?.id }`
 */
export const assertElements = <T extends AllPossibleKeys<ExcalidrawElement>>(
  actualElements: readonly ExcalidrawElement[],
  /** array order matters */
  expectedElements: (Partial<Record<T, any>> & {
    /** meta, will be stripped for element attribute checks */
    selected?: true;
  } & (
      | {
          id: ExcalidrawElement["id"];
        }
      | { [ORIG_ID]?: string }
    ))[],
) => {
  const h = window.h;

  const expectedElementsWithIds: (typeof expectedElements[number] & {
    id: ExcalidrawElement["id"];
  })[] = expectedElements.map((el) => {
    if ("id" in el) {
      return el;
    }
    const actualElement = actualElements.find(
      (act) => (act as any)[ORIG_ID] === el[ORIG_ID],
    );
    if (actualElement) {
      return { ...el, id: actualElement.id };
    }
    return {
      ...el,
      id: "UNKNOWN_ID",
    };
  });

  const map_expectedElements = arrayToMap(expectedElementsWithIds);

  const selectedElementIds = expectedElementsWithIds.reduce(
    (acc: Record<ExcalidrawElement["id"], true>, el) => {
      if (el.selected) {
        acc[el.id] = true;
      }
      return acc;
    },
    {},
  );

  const mappedActualElements = actualElements.map((el) => {
    const expectedElement = map_expectedElements.get(el.id);
    if (expectedElement) {
      const pickedAttrs: Record<string, any> = {};

      for (const key of Object.keys(expectedElement)) {
        if (key === "selected") {
          delete expectedElement.selected;
          continue;
        }
        pickedAttrs[key] = (el as any)[key];
      }

      if (ORIG_ID in expectedElement) {
        // @ts-ignore
        pickedAttrs[ORIG_ID] = (el as any)[ORIG_ID];
      }

      return pickedAttrs;
    }
    return el;
  });

  try {
    // testing order separately for even easier diffs
    expect(actualElements.map((x) => x.id)).toEqual(
      expectedElementsWithIds.map((x) => x.id),
    );
  } catch (err: any) {
    let errStr = "\n\nmismatched element order\n\n";

    errStr += `actual:   ${ansi.lightGray(
      `[${err.actual
        .map((id: string, index: number) => {
          const act = actualElements[index];

          return `${
            id === err.expected[index] ? ansi.green(id) : ansi.red(id)
          } (${act.type.slice(0, 4)}${
            ORIG_ID in act ? ` ↳ ${(act as any)[ORIG_ID]}` : ""
          })`;
        })
        .join(", ")}]`,
    )}\n${ansi.lightGray(
      `expected: [${err.expected
        .map((exp: string, index: number) => {
          const expEl = actualElements.find((el) => el.id === exp);
          const origEl =
            expEl &&
            actualElements.find((el) => el.id === (expEl as any)[ORIG_ID]);
          return expEl
            ? `${
                exp === err.actual[index]
                  ? ansi.green(expEl.id)
                  : ansi.red(expEl.id)
              } (${expEl.type.slice(0, 4)}${origEl ? ` ↳ ${origEl.id}` : ""})`
            : exp;
        })
        .join(", ")}]\n`,
    )}`;

    throw trimErrorStack(new Error(errStr), 1);
  }

  expect(mappedActualElements).toEqual(
    expect.arrayContaining(expectedElementsWithIds as unknown[]),
  );

  expect(h.state.selectedElementIds).toEqual(selectedElementIds);
};

const stripProps = (
  deltas: Record<string, { deleted: any; inserted: any }>,
  props: string[],
) =>
  Object.entries(deltas).reduce((acc, curr) => {
    const { inserted, deleted, ...rest } = curr[1];

    for (const prop of props) {
      delete inserted[prop];
      delete deleted[prop];
    }

    acc[curr[0]] = {
      inserted,
      deleted,
      ...rest,
    };

    return acc;
  }, {} as Record<string, any>);

export const checkpointHistory = (history: History, name: string) => {
  expect(
    history.undoStack.map((x) => ({
      ...x,
      elements: {
        ...x.elements,
        added: stripProps(x.elements.added, ["seed", "versionNonce"]),
        removed: stripProps(x.elements.removed, ["seed", "versionNonce"]),
        updated: stripProps(x.elements.updated, ["seed", "versionNonce"]),
      },
    })),
  ).toMatchSnapshot(`[${name}] undo stack`);

  expect(
    history.redoStack.map((x) => ({
      ...x,
      elements: {
        ...x.elements,
        added: stripProps(x.elements.added, ["seed", "versionNonce"]),
        removed: stripProps(x.elements.removed, ["seed", "versionNonce"]),
        updated: stripProps(x.elements.updated, ["seed", "versionNonce"]),
      },
    })),
  ).toMatchSnapshot(`[${name}] redo stack`);
};

/**
 * removes one or more leading stack trace lines (leading to files) from the
 * error stack trace
 */
export const trimErrorStack = (error: Error, range = 1) => {
  const stack = error.stack?.split("\n");
  if (stack) {
    stack.splice(1, range);
    error.stack = stack.join("\n");
  }
  return error;
};

export const stripIgnoredNodesFromErrorMessage = (error: Error) => {
  error.message = error.message.replace(/\s+Ignored nodes:[\s\S]+/, "");
  return error;
};
