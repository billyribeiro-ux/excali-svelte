/**
 * Framework-neutral replacement for `React.Component`, for the editor core
 * (`components/App`).
 *
 * `App` was written against React's class-component contract and relies on its
 * observable semantics:
 *
 * - `setState` never mutates `this.state` synchronously — updates queue and are
 *   committed together at the end of `flushSync`, in a microtask when issued
 *   from a discrete DOM event (click, keydown, paste, ...), otherwise in a
 *   later task (see `isInDiscreteEvent`);
 * - updater functions receive the state with all earlier queued updates applied;
 * - `getSnapshotBeforeUpdate` -> view commit -> `componentDidUpdate(prevProps,
 *   prevState, snapshot)` run once per committed batch, `prevState` being the
 *   state from before the batch;
 * - `setState` callbacks run after the commit;
 * - `setState` inside `componentDidUpdate` is committed before control returns
 *   to the caller of `flushSync`.
 *
 * The view layer (Svelte) registers via `subscribeCommit()`; its listener runs
 * where React would have committed the DOM, i.e. before `componentDidUpdate`.
 */

type Callback = () => void;

type StateUpdate<P, S> =
  | Partial<S>
  | null
  | ((prevState: Readonly<S>, props: Readonly<P>) => Partial<S> | null);

type PendingUpdate<P, S> = {
  update: StateUpdate<P, S>;
};

const MAX_NESTED_COMMITS = 50;

/** editors with queued updates, committed together by `flushPending()` */
const dirtyEditors = new Set<Editor<any, any>>();
let batchDepth = 0;
let microtaskScheduled = false;
let macrotaskScheduled = false;

/**
 * React 18 flushes an update synchronously-in-a-microtask only when it was
 * issued from a *discrete* event (click, keydown, pointerdown, paste, drop, ...)
 * and otherwise (after an `await`, timers, continuous events such as
 * pointermove/wheel/scroll) schedules it as a macrotask (Scheduler:
 * `setImmediate` / `MessageChannel`). Code written against React depends on
 * that ordering — e.g. continuations of an `await`ed paste/drop handler run
 * before the update they follow is committed — so reproduce it.
 * (`getEventPriority` in react-dom.)
 */
const DISCRETE_EVENTS = new Set([
  "beforeinput",
  "blur",
  "cancel",
  "change",
  "click",
  "close",
  "compositionend",
  "compositionstart",
  "compositionupdate",
  "contextmenu",
  "copy",
  "cut",
  "auxclick",
  "dblclick",
  "dragend",
  "dragstart",
  "drop",
  "focus",
  "focusin",
  "focusout",
  "input",
  "invalid",
  "keydown",
  "keypress",
  "keyup",
  "mousedown",
  "mouseup",
  "paste",
  "pointercancel",
  "pointerdown",
  "pointerup",
  "reset",
  "resize",
  "selectionchange",
  "submit",
  "touchcancel",
  "touchend",
  "touchstart",
]);

const isInDiscreteEvent = () => {
  const type =
    typeof window !== "undefined"
      ? (window.event as Event | undefined)?.type
      : undefined;
  return type !== undefined && DISCRETE_EVENTS.has(type);
};

// captured at load, like React's scheduler (fake timers must not affect it)
const localSetImmediate: ((cb: () => void) => unknown) | null =
  typeof setImmediate === "function" ? setImmediate : null;
const localSetTimeout = setTimeout;
let messageChannel: MessageChannel | null = null;

const scheduleMacrotask = (cb: () => void) => {
  if (localSetImmediate) {
    localSetImmediate(cb);
  } else if (typeof MessageChannel !== "undefined") {
    if (!messageChannel) {
      messageChannel = new MessageChannel();
      messageChannel.port1.onmessage = () => pendingMacrotask?.();
    }
    pendingMacrotask = cb;
    messageChannel.port2.postMessage(null);
  } else {
    localSetTimeout(cb, 0);
  }
};
let pendingMacrotask: (() => void) | null = null;

const runScheduledFlush = () => {
  if (batchDepth === 0) {
    flushPending();
  }
};

const scheduleFlush = (discrete: boolean) => {
  if (discrete) {
    if (!microtaskScheduled) {
      microtaskScheduled = true;
      queueMicrotask(() => {
        microtaskScheduled = false;
        runScheduledFlush();
      });
    }
  } else if (!macrotaskScheduled) {
    macrotaskScheduled = true;
    scheduleMacrotask(() => {
      macrotaskScheduled = false;
      runScheduledFlush();
    });
  }
};

const flushPending = () => {
  let guard = 0;
  while (dirtyEditors.size > 0) {
    if (++guard > MAX_NESTED_COMMITS) {
      dirtyEditors.clear();
      throw new Error("Editor: maximum update depth exceeded");
    }
    const editors = [...dirtyEditors];
    dirtyEditors.clear();
    for (const editor of editors) {
      editor.commit();
    }
  }
};

/**
 * Runs `fn`, then commits all queued editor updates synchronously
 * (counterpart of `ReactDOM.flushSync`).
 */
export const flushSync = <T = void>(fn?: () => T): T | undefined => {
  batchDepth++;
  let result: T | undefined;
  try {
    result = fn?.();
  } finally {
    batchDepth--;
  }
  if (batchDepth === 0) {
    flushPending();
  }
  return result;
};

/**
 * Runs `fn`; updates it queues are committed together afterwards (counterpart
 * of `ReactDOM.unstable_batchedUpdates`, which in React 18+ only groups).
 */
export const batchedUpdates = <T>(fn: () => T): T => {
  return fn();
};

export abstract class Editor<P, S> {
  props: Readonly<P>;
  state: Readonly<S>;

  private pending: PendingUpdate<P, S>[] = [];
  private callbacks: Callback[] = [];
  private pendingProps: Readonly<P> | null = null;
  private commitListeners = new Set<Callback>();
  private postCommitListeners = new Set<Callback>();
  /**
   * `true` from the moment the view commit listeners run until the
   * post-commit listeners have run (see `subscribePostCommit`).
   */
  private paintDeferrals = 0;
  get paintDeferred() {
    return this.paintDeferrals > 0;
  }
  private mounted = false;
  private isUnmounted = false;
  private forced = false;

  constructor(props: P, initialState?: S) {
    this.props = props;
    // subclasses may assign `this.state` in their constructor (React-style)
    this.state = (initialState ?? {}) as S;
  }

  /** lifecycle hooks, overridden by subclasses */
  componentDidMount?(): void | Promise<void>;
  componentWillUnmount?(): void;
  getSnapshotBeforeUpdate?(
    prevProps: Readonly<P>,
    prevState: Readonly<S>,
  ): unknown;
  componentDidUpdate?(
    prevProps: Readonly<P>,
    prevState: Readonly<S>,
    snapshot?: unknown,
  ): void;

  setState<K extends keyof S>(
    update: StateUpdate<P, S> | Pick<S, K>,
    callback?: Callback,
  ) {
    this.pending.push({ update: update as StateUpdate<P, S> });
    if (callback) {
      this.callbacks.push(callback);
    }
    this.markDirty();
  }

  forceUpdate(callback?: Callback) {
    this.forced = true;
    if (callback) {
      this.callbacks.push(callback);
    }
    this.markDirty();
  }

  /** called by the view layer when the props it passes to the editor change */
  setProps(props: Readonly<P>) {
    this.pendingProps = props;
    this.markDirty();
  }

  /**
   * Registers the view's commit handler. It runs after `state`/`props` are
   * updated and before `componentDidUpdate`, and must update the DOM
   * synchronously.
   */
  subscribeCommit(listener: Callback) {
    this.commitListeners.add(listener);
    return () => {
      this.commitListeners.delete(listener);
    };
  }

  /**
   * Registers a handler for React's *passive effects* phase: it runs after
   * `componentDidUpdate` and the `setState` callbacks of the same commit (and
   * before any update those queued is committed). The view uses it to paint
   * canvases, which React did in `useEffect`, i.e. after `componentDidUpdate`.
   * While the view commit and `componentDidUpdate` run, `paintDeferred` is true.
   */
  subscribePostCommit(listener: Callback) {
    this.postCommitListeners.add(listener);
    return () => {
      this.postCommitListeners.delete(listener);
    };
  }

  /** called by the view layer once the initial view is rendered */
  mount() {
    if (this.mounted) {
      return;
    }
    this.mounted = true;
    void this.componentDidMount?.();
  }

  /** called by the view layer when it is torn down */
  unmount() {
    if (!this.mounted) {
      return;
    }
    this.mounted = false;
    this.isUnmounted = true;
    this.pending = [];
    this.callbacks = [];
    this.pendingProps = null;
    dirtyEditors.delete(this);
    this.componentWillUnmount?.();
    this.commitListeners.clear();
    this.postCommitListeners.clear();
  }

  /** @internal commits queued updates; invoked by the batching machinery */
  commit() {
    const hasWork =
      this.pending.length > 0 || this.pendingProps !== null || this.forced;
    if (!hasWork && this.callbacks.length === 0) {
      return;
    }

    const prevProps = this.props;
    const prevState = this.state;

    const nextProps = this.pendingProps ?? prevProps;
    let nextState = prevState;
    for (const { update } of this.pending) {
      const partial =
        typeof update === "function" ? update(nextState, nextProps) : update;
      if (partial) {
        nextState = { ...nextState, ...partial };
      }
    }
    const callbacks = this.callbacks;

    this.pending = [];
    this.callbacks = [];
    this.pendingProps = null;
    this.forced = false;

    const changed = nextState !== prevState || nextProps !== prevProps;

    this.props = nextProps;
    this.state = nextState;

    if (changed || hasWork) {
      this.paintDeferrals++;
      try {
        const snapshot = this.mounted
          ? this.getSnapshotBeforeUpdate?.(prevProps, prevState)
          : undefined;
        for (const listener of [...this.commitListeners]) {
          listener();
        }
        if (this.mounted) {
          this.componentDidUpdate?.(prevProps, prevState, snapshot);
        }
        for (const callback of callbacks) {
          callback();
        }
      } finally {
        this.paintDeferrals--;
      }
      for (const listener of [...this.postCommitListeners]) {
        listener();
      }
      return;
    }

    for (const callback of callbacks) {
      callback();
    }
  }

  private markDirty() {
    if (this.isUnmounted) {
      // like React, ignore updates to an unmounted component
      this.pending = [];
      this.callbacks = [];
      this.pendingProps = null;
      return;
    }
    dirtyEditors.add(this);
    if (batchDepth === 0) {
      scheduleFlush(isInDiscreteEvent());
    }
  }
}
