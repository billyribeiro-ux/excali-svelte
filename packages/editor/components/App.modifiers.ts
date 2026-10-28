import { Emitter, KEYS } from "@svelte-draw/common";

import { createSignal } from "../ui/signal";

export type HeldModifiers = Readonly<{
  alt: boolean;
  shift: boolean;
  /** Ctrl, or Cmd on macOS */
  ctrlOrCmd: boolean;
}>;

const NONE_HELD: HeldModifiers = {
  alt: false,
  shift: false,
  ctrlOrCmd: false,
};

const pick = (held: HeldModifiers, modifier?: keyof HeldModifiers) =>
  modifier ? held[modifier] : held;

/**
 * The modifier keys held over the editor, synced from the flags of its
 * keyboard and pointer events. Kept out of appState so that pressing one
 * re-renders only its subscribers (e.g. the hint).
 */
export class AppModifiers {
  private held = NONE_HELD;
  /** fires with a new snapshot whenever a modifier is pressed or released */
  readonly onChange = new Emitter<[held: HeldModifiers]>();

  get = (): HeldModifiers => this.held;

  private readonly heldSignal = createSignal(NONE_HELD);

  /**
   * Reactive view of the held modifiers for Svelte templates/effects: all of
   * them, or with `modifier`, only that one. Read `.current`; a boolean that
   * did not change does not re-run dependents.
   */
  useHeld(): { readonly current: HeldModifiers };
  useHeld(modifier: keyof HeldModifiers): { readonly current: boolean };
  useHeld(modifier?: keyof HeldModifiers) {
    const signal = this.heldSignal;
    return {
      get current() {
        return pick(signal.get(), modifier);
      },
    };
  }

  sync = (event: {
    altKey: boolean;
    shiftKey: boolean;
    ctrlKey: boolean;
    metaKey: boolean;
  }) => {
    this.set({
      alt: event.altKey,
      shift: event.shiftKey,
      ctrlOrCmd: event[KEYS.CTRL_OR_CMD],
    });
  };

  /** releases them all — e.g. on blur, as Alt+Tab never delivers the keyup */
  reset = () => {
    this.set(NONE_HELD);
  };

  private set(held: HeldModifiers) {
    if (
      held.alt !== this.held.alt ||
      held.shift !== this.held.shift ||
      held.ctrlOrCmd !== this.held.ctrlOrCmd
    ) {
      this.held = held;
      this.heldSignal.set(held);
      this.onChange.trigger(held);
    }
  }
}
