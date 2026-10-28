/**
 * App-level atoms (replaces `excalidraw-app/app-jotai.ts`).
 *
 * The React app used a dedicated jotai store (`appJotaiStore`) separate from
 * the editor's. The same split is kept: every atom in this file lives in
 * `appAtomStore`, NOT in the editor's `editorJotaiStore`. Always read/write
 * them through `appAtomStore` or `useAtom`/`useAtomValue`/`useSetAtom` below (bound to the app store), otherwise you
 * would silently address the editor store and see the atom's initial value.
 *
 * All atoms are defined here (and re-exported from the modules that used to
 * own them) so that `data/`, `collab/` and the UI can share them without
 * import cycles.
 */
import {
  atom,
  AtomStore,
  useAtom as useEditorStoreAtom,
  useAtomValue as useEditorStoreAtomValue,
  useSetAtom as useEditorStoreSetAtom,
} from "@svelte-draw/editor/editor-jotai";

import { getPreferredLanguage } from "./app-language/language-detector.ts";

import type { PrimitiveAtom } from "@svelte-draw/editor/editor-jotai";
import type { UserToFollow } from "@svelte-draw/editor/types";
import type { CollabAPI } from "./collab/Collab.ts";

export { atom, AtomStore };
export type { PrimitiveAtom };

export const appAtomStore = new AtomStore();

/**
 * Reactive `{ current }` accessor bound to the APP store. Same names as the
 * former `app-jotai.ts` exports (which were bound to `appJotaiStore` through
 * its `<Provider>`), so ported code can keep calling `useAtom(a)` etc.
 */
export const useAtom = <T>(a: PrimitiveAtom<T>) =>
  useEditorStoreAtom(a, appAtomStore);
/** read-only reactive `{ current }` accessor bound to the app store */
export const useAtomValue = <T>(a: PrimitiveAtom<T>) =>
  useEditorStoreAtomValue(a, appAtomStore);
/** setter bound to the app store */
export const useSetAtom = <T>(a: PrimitiveAtom<T>) =>
  useEditorStoreSetAtom(a, appAtomStore);

// collab ----------------------------------------------------------------------

export const collabAPIAtom = atom<CollabAPI | null>(null);
export const isCollaboratingAtom = atom(false);
export const isOfflineAtom = atom(
  typeof navigator !== "undefined" && !navigator.onLine,
);
export const activeRoomLinkAtom = atom<string | null>(null);
export const userToFollowAtom = atom<UserToFollow | null>(null);

export type CollabErrorIndicator = {
  message: string | null;
  /** used to rerun the animation in `CollabError.svelte` */
  nonce: number;
};

export const collabErrorIndicatorAtom = atom<CollabErrorIndicator>({
  message: null,
  nonce: 0,
});

/**
 * Message to show in an `ErrorDialog` (replaces the `errorMessage` state that
 * `<Collab>` rendered itself). `App.svelte` must render
 * `<ErrorDialog onClose={() => collabAPI.setCollabError(null)}>` while it is
 * non-null.
 */
export const collabErrorDialogAtom = atom<string | null>(null);

// storage ---------------------------------------------------------------------

export const localStorageQuotaExceededAtom = atom(false);

// language --------------------------------------------------------------------

export const appLangCodeAtom = atom(getPreferredLanguage());
