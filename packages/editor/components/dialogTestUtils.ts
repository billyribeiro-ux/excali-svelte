import { vi } from "vitest";

import type { EditorContextValue } from "../ui/editorContext";

/** minimal editor context stub that satisfies `Dialog.svelte` / `Modal.svelte` */
export const makeDialogCtx = (
  overrides: Record<string, unknown> = {},
): EditorContextValue =>
  ({
    app: {
      ownerDocument: document,
      ownerWindow: window,
      id: "test-app",
      renderEnvironment: undefined,
      onInsertElements: vi.fn(),
      focusContainer: vi.fn(),
      ...((overrides.app as object) ?? {}),
    },
    editorInterface: { formFactor: "desktop" },
    appState: { theme: "light" },
    container: document.body,
    setAppState: vi.fn(),
    actionManager: {
      isActionEnabled: () => true,
      executeAction: vi.fn(),
    },
    ...overrides,
  }) as unknown as EditorContextValue;
