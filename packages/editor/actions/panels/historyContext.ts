import { createContext } from "svelte";

import type { History } from "../../history";

/**
 * The undo/redo actions are created per `History` instance
 * (`createUndoAction(history)`); their panels read it from context, set by the
 * wrapper component created in `actionHistory.ts`.
 */
export const [getHistoryContext, setHistoryContext] = createContext<History>();
