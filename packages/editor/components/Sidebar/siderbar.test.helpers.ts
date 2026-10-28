import { expect } from "vitest";

import type { RenderResult } from "@testing-library/svelte";

/**
 * Asserts the rendered sidebar's dock button presence and returns it.
 * (The React helper read the container from the global test state.)
 */
export const assertSidebarDockButton = async <T extends boolean>(
  container: RenderResult<any>["container"],
  hasDockButton: T,
): Promise<
  T extends false
    ? { dockButton: null; sidebar: HTMLElement }
    : { dockButton: HTMLElement; sidebar: HTMLElement }
> => {
  const sidebar = container.querySelector<HTMLElement>(".sidebar");
  expect(sidebar).not.toBe(null);
  const dockButton = sidebar!.querySelector<HTMLElement>(
    '[data-testid="sidebar-dock"]',
  );
  if (hasDockButton) {
    expect(dockButton).not.toBe(null);
    return { dockButton: dockButton!, sidebar: sidebar! } as any;
  }
  expect(dockButton).toBe(null);
  return { dockButton: null, sidebar: sidebar! } as any;
};
