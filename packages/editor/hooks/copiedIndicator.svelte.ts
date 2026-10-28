const TIMEOUT = 2000;

/**
 * Reactive "copied" indicator (replaces `useCopyStatus`). Call during
 * component initialization; the pending reset timer is cleared when the
 * component is destroyed.
 */
export const createCopyStatus = () => {
  let copyStatus = $state<"success" | null>(null);
  let timeout: ReturnType<typeof setTimeout> | undefined;

  $effect(() => () => clearTimeout(timeout));

  return {
    get copyStatus() {
      return copyStatus;
    },
    onCopy() {
      clearTimeout(timeout);
      copyStatus = "success";
      timeout = setTimeout(() => {
        copyStatus = null;
      }, TIMEOUT);
    },
    resetCopyStatus() {
      copyStatus = null;
    },
  };
};
