import { vi } from "vitest";

import type { EditorContextValue } from "./editorContext";

/**
 * Test helper: an `EditorContextValue` with just enough for the UI primitives
 * (dialogs, popovers, ...). Pass `overrides` for anything a test cares about.
 */
export const createFakeEditorContext = (
  overrides: Partial<{
    [K in keyof EditorContextValue]: unknown;
  }> = {},
): EditorContextValue => {
  const container = document.createElement("div");
  container.tabIndex = -1;
  document.body.appendChild(container);

  const app = {
    id: "test-editor",
    ownerDocument: document,
    ownerWindow: window,
    props: {},
  };

  return {
    app,
    props: {},
    appState: { theme: "light", width: 800, height: 600, openMenu: null },
    elements: [],
    actionManager: { app, executeAction: vi.fn() },
    editorInterface: { formFactor: "desktop" },
    api: null,
    container,
    setAppState: vi.fn(),
    ...overrides,
  } as unknown as EditorContextValue;
};
