import type { Component, Snippet } from "svelte";

/**
 * Content a host or the editor can show in a message slot (error dialog, toast,
 * viewport badge, export progress, …): plain text, a snippet declared by the
 * host, or an internal component (optionally with props).
 *
 * Replaces `React.ReactNode` in those positions; render it with
 * `<UIContent {content} />`.
 */
export type UIContent =
  | string
  | Snippet
  | { component: Component<any>; props?: Record<string, unknown> };
