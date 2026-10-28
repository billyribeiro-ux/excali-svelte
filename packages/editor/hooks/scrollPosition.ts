import throttle from "lodash.throttle";

import { atom, editorJotaiStore } from "../editor-jotai";

import type { Attachment } from "svelte/attachments";

/** last `scrollTop` reported by an element using {@link trackScrollPosition} */
export const scrollPositionAtom = atom<number>(0);

/**
 * Attachment (replaces `useScrollPosition`): throttles the element's `scroll`
 * events (200ms) into {@link scrollPositionAtom}. Read it reactively with
 * `useAtomValue(scrollPositionAtom).current`.
 */
export const trackScrollPosition: Attachment<HTMLElement> = (element) => {
  const handleScroll = throttle(() => {
    editorJotaiStore.set(scrollPositionAtom, element.scrollTop);
  }, 200);

  element.addEventListener("scroll", handleScroll);

  return () => {
    handleScroll.cancel();
    element.removeEventListener("scroll", handleScroll);
  };
};
