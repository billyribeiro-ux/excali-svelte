import { atom } from "../editor-jotai";

export const activeConfirmDialogAtom = atom<"clearCanvas" | null>(null);
