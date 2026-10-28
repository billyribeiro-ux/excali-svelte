import { render, screen, within } from "@testing-library/svelte";
import { describe, expect, it, vi } from "vitest";

import { makeDialogCtx } from "./dialogTestUtils";
import Harness from "./DialogContextHarness.test.svelte";
import HelpDialog from "./HelpDialog.svelte";

// the real module drags in bits-ui through the actions' panel components,
// which vitest cannot load as an externalized dependency
vi.mock("../actions/actionCanvas", () => ({
  actionToggleTheme: { name: "toggleTheme" },
}));

const setup = (isThemeActionEnabled = true) => {
  const onClose = vi.fn();
  render(Harness, {
    component: HelpDialog,
    componentProps: { onClose },
    ctx: makeDialogCtx({
      actionManager: {
        isActionEnabled: () => isThemeActionEnabled,
        executeAction: vi.fn(),
      },
    }),
  });
  return { onClose };
};

describe("HelpDialog", () => {
  it("renders the title, the doc links and the three shortcut islands", () => {
    setup();
    expect(screen.getByText("Help")).toBeInTheDocument();
    const links = document.querySelectorAll(".HelpDialog__btn");
    expect([...links].map((a) => a.getAttribute("href"))).toEqual([
      "https://github.com/billyribeiro-ux/excali-svelte/tree/main/docs",
      "https://github.com/billyribeiro-ux/excali-svelte/issues",
    ]);
    expect(document.querySelector(".HelpDialog__island--tools")).not.toBeNull();
    expect(document.querySelector(".HelpDialog__island--view")).not.toBeNull();
    expect(
      document.querySelector(".HelpDialog__island--editor"),
    ).not.toBeNull();
  });

  const shortcutRow = (label: string) =>
    [...document.querySelectorAll(".HelpDialog__shortcut")].find(
      (row) => row.firstElementChild?.textContent === label,
    ) as HTMLElement;

  it("renders alternative shortcuts separated by 'or'", () => {
    setup();
    const row = shortcutRow("Selection");
    expect(row).toBeTruthy();
    expect(
      [...row.querySelectorAll("kbd")].map((kbd) => kbd.textContent),
    ).toEqual(["V", "1"]);
    expect(row.querySelector(".HelpDialog__key-container")).toHaveTextContent(
      /V\s*or\s*1/,
    );
  });

  it("splits modifier combos into separate keys and keeps a trailing '+'", () => {
    setup();
    const zoomIn = shortcutRow("Zoom in");
    expect(
      [...zoomIn.querySelectorAll("kbd")].map((kbd) => kbd.textContent),
    ).toEqual([expect.stringMatching(/Ctrl|⌘/), "+"]);
  });

  it("hides the theme shortcut when the theme action is disabled", () => {
    setup(false);
    expect(shortcutRow("Toggle light/dark theme")).toBeUndefined();
  });

  it("shows the theme shortcut when the theme action is enabled", () => {
    setup(true);
    expect(within(shortcutRow("Toggle light/dark theme")).getAllByText(/./).length).toBeGreaterThan(0);
  });
});
