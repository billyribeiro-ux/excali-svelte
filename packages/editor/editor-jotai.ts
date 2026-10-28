/**
 * Editor-wide atoms. Replaces the former jotai store with a tiny primitive-atom
 * store that is reactive inside Svelte effects/templates (see `ui/signal.ts`).
 *
 * Only primitive atoms are supported (value + optional updater function), which
 * is all the editor used. The file keeps its name so non-UI code importing
 * `editorJotaiStore` / `atom` is unaffected.
 */
import { createSignal, type Signal } from "./ui/signal";

export class Atom<T> {
  constructor(readonly initialValue: T) {}
}

export type PrimitiveAtom<T> = Atom<T>;
export type SetStateAction<T> = T | ((prev: T) => T);

export const atom = <T>(initialValue: T): Atom<T> => new Atom(initialValue);

export class AtomStore {
  private cells = new Map<Atom<any>, Signal<any>>();

  private cell<T>(a: Atom<T>): Signal<T> {
    let cell = this.cells.get(a);
    if (!cell) {
      cell = createSignal(a.initialValue);
      this.cells.set(a, cell);
    }
    return cell;
  }

  /** reactive when read inside a Svelte effect/template */
  get<T>(a: Atom<T>): T {
    return this.cell(a).get();
  }

  peek<T>(a: Atom<T>): T {
    return this.cell(a).peek();
  }

  set<T>(a: Atom<T>, action: SetStateAction<T>) {
    const cell = this.cell(a);
    cell.set(
      typeof action === "function"
        ? (action as (prev: T) => T)(cell.peek())
        : action,
    );
  }

  sub<T>(a: Atom<T>, listener: () => void) {
    const cell = this.cell(a);
    return cell.subscribe(() => listener());
  }
}

/** default store shared by the editor (formerly `editorJotaiStore`) */
export const editorJotaiStore = new AtomStore();

/**
 * Component-side accessors. They return objects with a reactive `current`
 * instead of tuples because Svelte cannot re-run a destructured hook result.
 */
export const useAtom = <T>(a: Atom<T>, store: AtomStore = editorJotaiStore) => ({
  get current() {
    return store.get(a);
  },
  set current(value: T) {
    store.set(a, value);
  },
});

export const useAtomValue = <T>(
  a: Atom<T>,
  store: AtomStore = editorJotaiStore,
) => ({
  get current() {
    return store.get(a);
  },
});

export const useSetAtom =
  <T>(a: Atom<T>, store: AtomStore = editorJotaiStore) =>
  (action: SetStateAction<T>) =>
    store.set(a, action);
