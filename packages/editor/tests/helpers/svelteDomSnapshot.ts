/**
 * Snapshot serializer that makes DOM snapshots of Svelte-rendered markup
 * comparable with the ones recorded from the React renderer.
 *
 * Svelte leaves anchor comment nodes (`<!---->`) and whitespace-only /
 * split text nodes in the DOM that React never produced. They carry no
 * rendered content, so they are dropped (comments, whitespace-only text) and
 * adjacent text nodes are merged before serializing. Elements, attributes and
 * real text are left untouched — any other difference still fails.
 */
const normalized = new WeakSet<Element>();

const normalize = (root: Element) => {
  const walker = root.ownerDocument.createTreeWalker(
    root,
    NodeFilter.SHOW_COMMENT | NodeFilter.SHOW_TEXT,
  );
  const remove: Node[] = [];
  let node = walker.nextNode();
  while (node) {
    if (
      node.nodeType === Node.COMMENT_NODE ||
      (node.nodeType === Node.TEXT_NODE && !node.textContent?.trim())
    ) {
      remove.push(node);
    }
    node = walker.nextNode();
  }
  remove.forEach((n) => n.parentNode?.removeChild(n));
  root.normalize();
  const walker2 = root.ownerDocument.createTreeWalker(
    root,
    NodeFilter.SHOW_TEXT,
  );
  node = walker2.nextNode();
  while (node) {
    node.textContent = (node.textContent || "").trim();
    node = walker2.nextNode();
  }
};

export const svelteDomSnapshotSerializer = {
  test: (value: unknown) =>
    typeof Element !== "undefined" &&
    value instanceof Element &&
    !normalized.has(value),
  serialize: (
    value: Element,
    config: any,
    indentation: string,
    depth: number,
    refs: any,
    printer: (...args: any[]) => string,
  ) => {
    const clone = value.cloneNode(true) as Element;
    normalize(clone);
    normalized.add(clone);
    return printer(clone, config, indentation, depth, refs);
  },
};
