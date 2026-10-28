<script lang="ts">
  import { KEYS } from "@svelte-draw/common";

  import { t } from "../../i18n";

  import type { ClassValue } from "svelte/elements";

  import "./TopPicksDnD.scss";

  /**
   * "drag to pin" hint shown in a picker popup whose top picks are
   * customizable — with a reset link while the picks are customized
   */
  type Props = {
    class?: ClassValue;
    tip: string;
    /** present only while the top picks are customized */
    onReset?: () => void;
    resetTitle: string;
  };

  let { class: className, tip, onReset, resetTitle }: Props = $props();

  const handleReset = (
    event: MouseEvent & { currentTarget: HTMLButtonElement },
  ) => {
    // ...and when it had it (keyboard), hand it back to the picker
    const button = event.currentTarget;
    const focusTarget =
      button.ownerDocument.activeElement === button
        ? button.parentElement?.closest<HTMLElement>("[tabindex]")
        : null;
    onReset?.();
    focusTarget?.focus();
  };
</script>

<div class={["top-picks-dnd__tip", className]}>
  {tip}
  {#if onReset}
    <!-- eslint-disable-next-line svelte/no-useless-mustaches -- literal keeps the boundary whitespace around the separator -->
    {" · "}
    <button
      type="button"
      class="top-picks-dnd__tip-reset"
      title={resetTitle}
      onmousedown={(event) => {
        // the link unmounts on reset — don't let it take the focus
        // (it'd drop to <body>, killing the picker's keyboard handling)
        event.preventDefault();
      }}
      onclick={handleReset}
      onkeydown={(event) => {
        // the pickers' key handlers act on these (e.g. Enter picks the
        // hovered font) — keep them to the button
        if (event.key === KEYS.ENTER || event.key === KEYS.SPACE) {
          event.stopPropagation();
        }
      }}
    >
      {t("buttons.reset")}
    </button>
  {/if}
</div>
