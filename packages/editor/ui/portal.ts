import type { Attachment } from "svelte/attachments";

/**
 * Attachment factory replacing `ReactDOM.createPortal`: on mount, moves the
 * element into `target` (appended as its last child) and removes it again when
 * the attachment is destroyed (i.e. when the element's block is torn down).
 *
 * ```svelte
 * <div {@attach portal(container)}>...</div>
 * ```
 *
 * Passing a function makes the target lazily/reactively resolved: it is read
 * inside the attachment's effect, so state read by it re-runs the attachment.
 */
export const portal =
  (target: HTMLElement | (() => HTMLElement)): Attachment<HTMLElement> =>
  (element) => {
    const container = typeof target === "function" ? target() : target;
    container.appendChild(element);

    return () => {
      element.remove();
    };
  };
