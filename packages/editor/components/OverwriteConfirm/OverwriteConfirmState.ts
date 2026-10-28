import { atom, editorJotaiStore } from "../../editor-jotai";

import type { UIContent } from "../../ui/content";

export type OverwriteConfirmState =
  | {
      active: true;
      title: string;
      description: UIContent;
      actionLabel: string;
      color: "danger" | "warning";

      onClose: () => void;
      onConfirm: () => void;
      onReject: () => void;
    }
  | { active: false };

export const overwriteConfirmStateAtom = atom<OverwriteConfirmState>({
  active: false,
});

export async function openConfirmModal({
  title,
  description,
  actionLabel,
  color,
}: {
  title: string;
  /** plain text, or a snippet (replaces the React node) */
  description: UIContent;
  actionLabel: string;
  color: "danger" | "warning";
}) {
  return new Promise<boolean>((resolve) => {
    editorJotaiStore.set(overwriteConfirmStateAtom, {
      active: true,
      onConfirm: () => resolve(true),
      onClose: () => resolve(false),
      onReject: () => resolve(false),
      title,
      description,
      actionLabel,
      color,
    });
  });
}
