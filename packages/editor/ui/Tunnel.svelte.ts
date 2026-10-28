import { untrack, type Snippet } from "svelte";

/**
 * Svelte counterpart of `tunnel-rat`: content declared with `<TunnelIn>` is
 * rendered where the matching `<TunnelOut>` is placed. Like in React, the
 * content is instantiated at the `Out` location, so it sees that location's
 * context.
 */
export class Tunnel {
  private nextId = 0;
  entries = $state.raw<{ id: number; content: Snippet }[]>([]);

  add(content: Snippet) {
    const id = this.nextId++;
    untrack(() => {
      this.entries = [...this.entries, { id, content }];
    });
    return id;
  }

  update(id: number, content: Snippet) {
    untrack(() => {
      this.entries = this.entries.map((entry) =>
        entry.id === id ? { id, content } : entry,
      );
    });
  }

  remove(id: number) {
    untrack(() => {
      this.entries = this.entries.filter((entry) => entry.id !== id);
    });
  }

  get hasContent() {
    return this.entries.length > 0;
  }
}

export const createTunnel = () => new Tunnel();
