import { atom } from "#lib/app/app-atoms.ts";

import type { CollabAPI } from "#lib/app/collab/Collab.ts";

export type OnExportToBackend = () => void;
export type ShareDialogType = "share" | "collaborationOnly";

/**
 * Open/closed state of the share dialog. NOTE: lives in the app atom store;
 * read/write it via `appAtomStore` / `useAppAtom` from `app-atoms.ts`.
 */
export const shareDialogStateAtom = atom<
  { isOpen: false } | { isOpen: true; type: ShareDialogType }
>({ isOpen: false });

export type ShareDialogProps = {
  collabAPI: CollabAPI | null;
  handleClose: () => void;
  onExportToBackend: OnExportToBackend;
  type: ShareDialogType;
};
