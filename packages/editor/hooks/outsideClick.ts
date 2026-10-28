import { EVENT } from "@svelte-draw/common";

import type { Attachment } from "svelte/attachments";

/**
 * Attachment factory (replaces `useOutsideClick`): calls `callback` when a
 * pointerdown/touchstart lands outside the element it is attached to.
 *
 * ```svelte
 * <div {@attach outsideClick(onClose)}>...</div>
 * ```
 *
 * The attachment re-subscribes whenever reactive state read in the factory
 * expression changes; pass stable functions if that is a concern.
 */
export const outsideClick =
  <T extends HTMLElement>(
    callback: (event: Event & { target: T }) => void,
    /**
     * Optional callback which is called on every click.
     *
     * Should return `true` if click should be considered as inside the
     * container, and `false` if it falls outside and should call the
     * `callback`.
     *
     * Returning `true` overrides the default behavior and `callback` won't be
     * called.
     *
     * Returning `undefined` will fallback to the default behavior.
     */
    isInside?: (
      event: Event & { target: T },
      /** the element the attachment is applied to */
      container: T,
    ) => boolean | undefined,
  ): Attachment<T> =>
  (container) => {
    const ownerDocument = container.ownerDocument;

    const onOutsideClick = (event: Event) => {
      const _event = event as Event & { target: T };

      const isInsideOverride = isInside?.(_event, container);

      if (isInsideOverride === true) {
        return;
      } else if (isInsideOverride === false) {
        return callback(_event);
      }

      // clicked element is in the descenendant of the target container
      if (
        container.contains(_event.target) ||
        // target is detached from DOM (happens when the element is removed
        // on a pointerup event fired *before* this handler's pointerup is
        // dispatched)
        !ownerDocument.documentElement.contains(_event.target)
      ) {
        return;
      }

      const isClickOnFloatingPortal =
        // Bits UI floating content (popover/dropdown/context menu) is portaled
        // outside the container inside this wrapper
        // (node_modules/bits-ui/dist/bits/utilities/floating-layer/
        // use-floating-layer.svelte.js `wrapperProps`)
        _event.target.closest("[data-bits-floating-content-wrapper]") ||
        // when a popup is in "modal" mode, it disables pointer events on
        // the `body` element, so the target element is going to be the `html`
        // (note: this won't work if we selectively re-enable pointer events on
        // specific elements as we do with navbar or excalidraw UI elements)
        (_event.target === ownerDocument.documentElement &&
          ownerDocument.body.style.pointerEvents === "none");

      // if clicking on a floating portal, assume it's a popup that
      // should be considered as part of the UI. Obviously this is a terrible
      // hack you can end up click on popups that outside the tree,
      // but it works for most cases and the downside is minimal for now
      if (isClickOnFloatingPortal) {
        return;
      }

      // clicking on a container that ignores outside clicks
      if (_event.target.closest("[data-prevent-outside-click]")) {
        return;
      }

      callback(_event);
    };

    // note: don't use `click` because it often reports incorrect `event.target`
    ownerDocument.addEventListener(EVENT.POINTER_DOWN, onOutsideClick);
    ownerDocument.addEventListener(EVENT.TOUCH_START, onOutsideClick);

    return () => {
      ownerDocument.removeEventListener(EVENT.POINTER_DOWN, onOutsideClick);
      ownerDocument.removeEventListener(EVENT.TOUCH_START, onOutsideClick);
    };
  };
