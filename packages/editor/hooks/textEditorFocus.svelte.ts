// Utility type for caret position
export type CaretPosition = {
  start: number;
  end: number;
};

// Utility function to get text editor element
const getTextEditor = (ownerDocument: Document): HTMLTextAreaElement | null => {
  return ownerDocument.querySelector(
    ".excalidraw-wysiwyg",
  ) as HTMLTextAreaElement;
};

// Utility functions for caret position management
export const saveCaretPosition = (
  ownerDocument: Document = document,
): CaretPosition | null => {
  const textEditor = getTextEditor(ownerDocument);
  if (textEditor) {
    return {
      start: textEditor.selectionStart,
      end: textEditor.selectionEnd,
    };
  }
  return null;
};

export const restoreCaretPosition = (
  position: CaretPosition | null,
  ownerDocument: Document = document,
): void => {
  const ownerWindow = ownerDocument.defaultView ?? window;
  ownerWindow.setTimeout(() => {
    const textEditor = getTextEditor(ownerDocument);
    if (textEditor) {
      textEditor.focus();
      if (position) {
        textEditor.selectionStart = position.start;
        textEditor.selectionEnd = position.end;
      }
    }
  }, 0);
};

export const withCaretPositionPreservation = (
  callback: () => void,
  isCompactMode: boolean,
  isEditingText: boolean,
  onPreventClose?: () => void,
  ownerDocument: Document = document,
): void => {
  // Prevent popover from closing in compact mode
  if (isCompactMode && onPreventClose) {
    onPreventClose();
  }

  // Save caret position if editing text
  const savedPosition =
    isCompactMode && isEditingText ? saveCaretPosition(ownerDocument) : null;

  // Execute the callback
  callback();

  // Restore caret position if needed
  if (isCompactMode && isEditingText) {
    restoreCaretPosition(savedPosition, ownerDocument);
  }
};

// Reactive caret-position holder for the text editor (replaces the
// `useTextEditorFocus` hook). Call during component initialization.
// `ownerDocument` may be a getter if it can change.
export const createTextEditorFocus = (
  ownerDocument: Document | (() => Document) = () => document,
) => {
  const getDocument = () =>
    typeof ownerDocument === "function" ? ownerDocument() : ownerDocument;

  let savedCaretPosition = $state.raw<CaretPosition | null>(null);

  return {
    saveCaretPosition() {
      savedCaretPosition = saveCaretPosition(getDocument());
    },
    restoreCaretPosition() {
      const doc = getDocument();
      const ownerWindow = doc.defaultView ?? window;
      const position = savedCaretPosition;
      ownerWindow.setTimeout(() => {
        const textEditor = getTextEditor(doc);
        if (textEditor) {
          textEditor.focus();
          if (position) {
            textEditor.selectionStart = position.start;
            textEditor.selectionEnd = position.end;
            savedCaretPosition = null;
          }
        }
      }, 0);
    },
    clearSavedPosition() {
      savedCaretPosition = null;
    },
    get hasSavedPosition() {
      return !!savedCaretPosition;
    },
  };
};

// Utility function to temporarily disable text editor blur
export const temporarilyDisableTextEditorBlur = (
  ownerDocument: Document = document,
  duration: number = 100,
): void => {
  const textEditor = getTextEditor(ownerDocument);
  if (textEditor) {
    const originalOnBlur = textEditor.onblur;
    textEditor.onblur = null;

    const ownerWindow = ownerDocument.defaultView ?? window;
    ownerWindow.setTimeout(() => {
      textEditor.onblur = originalOnBlur;
    }, duration);
  }
};
