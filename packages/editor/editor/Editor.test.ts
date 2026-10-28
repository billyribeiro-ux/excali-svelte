import { describe, expect, it, vi } from "vitest";

import { Editor, flushSync } from "./Editor";

/** a macrotask: where React commits updates that are not issued from a discrete event */
const nextTask = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

type S = { count: number; label: string };
type P = { id: string };

class TestEditor extends Editor<P, S> {
  log: string[] = [];
  snapshotSeen: unknown;

  constructor(props: P = { id: "a" }) {
    super(props, { count: 0, label: "init" });
  }

  componentDidMount() {
    this.log.push("didMount");
  }

  componentWillUnmount() {
    this.log.push("willUnmount");
  }

  getSnapshotBeforeUpdate(prevProps: P, prevState: S) {
    this.log.push(`snapshot(prev=${prevState.count},now=${this.state.count})`);
    return `snap-${prevState.count}`;
  }

  componentDidUpdate(prevProps: P, prevState: S, snapshot: unknown) {
    this.snapshotSeen = snapshot;
    this.log.push(`didUpdate(prev=${prevState.count},now=${this.state.count})`);
  }
}

describe("Editor (React class-component semantics)", () => {
  it("does not mutate state synchronously and, outside a discrete event, commits in a later task (React: default lane)", async () => {
    const editor = new TestEditor();
    editor.mount();
    editor.setState({ count: 1 });
    expect(editor.state.count).toBe(0);
    await Promise.resolve();
    // updates issued after an `await`/timer are not committed in a microtask
    expect(editor.state.count).toBe(0);
    await nextTask();
    expect(editor.state.count).toBe(1);
  });

  it("commits in a microtask when issued from a discrete event handler (React: sync lane)", async () => {
    const editor = new TestEditor();
    editor.mount();
    const onKeyDown = () => editor.setState({ count: 1 });
    window.addEventListener("keydown", onKeyDown, { once: true });
    window.dispatchEvent(new KeyboardEvent("keydown"));
    expect(editor.state.count).toBe(0);
    await Promise.resolve();
    expect(editor.state.count).toBe(1);
  });

  it("commits in a later task when issued from a continuous event handler (pointermove)", async () => {
    const editor = new TestEditor();
    editor.mount();
    const onMove = () => editor.setState({ count: 1 });
    window.addEventListener("pointermove", onMove, { once: true });
    window.dispatchEvent(new Event("pointermove"));
    await Promise.resolve();
    expect(editor.state.count).toBe(0);
    await nextTask();
    expect(editor.state.count).toBe(1);
  });

  it("lets continuations of an awaited handler run before the update they follow is committed", async () => {
    const editor = new TestEditor();
    editor.mount();
    const order: string[] = [];
    const handler = async () => {
      await Promise.resolve();
      editor.setState({ count: 1 });
      order.push("after setState");
      await Promise.resolve();
      await Promise.resolve();
      order.push(`continuation (count=${editor.state.count})`);
    };
    await handler();
    expect(order).toEqual(["after setState", "continuation (count=0)"]);
    await nextTask();
    expect(editor.state.count).toBe(1);
  });

  it("batches several updates into a single commit with the pre-batch prevState", async () => {
    const editor = new TestEditor();
    editor.mount();
    editor.log.length = 0;
    editor.setState({ count: 1 });
    editor.setState({ label: "x" });
    editor.setState({ count: 2 });
    await nextTask();
    expect(editor.state).toEqual({ count: 2, label: "x" });
    expect(editor.log).toEqual([
      "snapshot(prev=0,now=2)",
      "didUpdate(prev=0,now=2)",
    ]);
    expect(editor.snapshotSeen).toBe("snap-0");
  });

  it("applies updater functions on top of earlier queued updates", async () => {
    const editor = new TestEditor();
    editor.setState((s) => ({ count: s.count + 1 }));
    editor.setState((s) => ({ count: s.count + 1 }));
    editor.setState({ label: "y" });
    editor.setState((s) => ({ label: `${s.label}!` }));
    await nextTask();
    expect(editor.state).toEqual({ count: 2, label: "y!" });
  });

  it("treats a null updater result as a no-op", async () => {
    const editor = new TestEditor();
    const prev = editor.state;
    editor.setState(() => null);
    await nextTask();
    expect(editor.state).toBe(prev);
  });

  it("flushSync commits immediately", () => {
    const editor = new TestEditor();
    editor.mount();
    flushSync(() => {
      editor.setState({ count: 5 });
      expect(editor.state.count).toBe(0);
    });
    expect(editor.state.count).toBe(5);
  });

  it("runs the view commit before componentDidUpdate, and callbacks after both", () => {
    const editor = new TestEditor();
    editor.mount();
    editor.log.length = 0;
    editor.subscribeCommit(() => editor.log.push("view"));
    flushSync(() => {
      editor.setState({ count: 1 }, () => editor.log.push("callback"));
    });
    expect(editor.log).toEqual([
      "snapshot(prev=0,now=1)",
      "view",
      "didUpdate(prev=0,now=1)",
      "callback",
    ]);
  });

  it("commits setState issued from componentDidUpdate before flushSync returns", () => {
    class Chained extends TestEditor {
      componentDidUpdate(prevProps: P, prevState: S) {
        super.componentDidUpdate(prevProps, prevState, undefined);
        if (this.state.count === 1) {
          this.setState({ count: 2 });
        }
      }
    }
    const editor = new Chained();
    editor.mount();
    flushSync(() => editor.setState({ count: 1 }));
    expect(editor.state.count).toBe(2);
  });

  it("updates props through setProps and exposes both to componentDidUpdate", async () => {
    const editor = new TestEditor({ id: "a" });
    editor.mount();
    const seen: string[] = [];
    editor.componentDidUpdate = (prevProps, _prevState) => {
      seen.push(`${prevProps.id}->${editor.props.id}`);
    };
    editor.setProps({ id: "b" });
    await nextTask();
    expect(seen).toEqual(["a->b"]);
  });

  it("does not call componentDidUpdate before mount or after unmount", async () => {
    const editor = new TestEditor();
    editor.setState({ count: 1 });
    await nextTask();
    expect(editor.log.some((l) => l.startsWith("didUpdate"))).toBe(false);
    editor.mount();
    editor.unmount();
    expect(editor.log).toContain("willUnmount");
    editor.log.length = 0;
    editor.setState({ count: 2 });
    await nextTask();
    expect(editor.log).toEqual([]);
  });

  it("commits several editors together inside one flushSync", () => {
    const a = new TestEditor();
    const b = new TestEditor();
    a.mount();
    b.mount();
    flushSync(() => {
      a.setState({ count: 1 });
      b.setState({ count: 2 });
    });
    expect([a.state.count, b.state.count]).toEqual([1, 2]);
  });

  it("forceUpdate triggers a commit and the view listener", () => {
    const editor = new TestEditor();
    editor.mount();
    const listener = vi.fn();
    editor.subscribeCommit(listener);
    flushSync(() => editor.forceUpdate());
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it("throws on runaway update loops", () => {
    class Loop extends TestEditor {
      componentDidUpdate() {
        this.setState((s) => ({ count: s.count + 1 }));
      }
    }
    const editor = new Loop();
    editor.mount();
    expect(() => flushSync(() => editor.setState({ count: 1 }))).toThrow(
      /maximum update depth/,
    );
  });
});
