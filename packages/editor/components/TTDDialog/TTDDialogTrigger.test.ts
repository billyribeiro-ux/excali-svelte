import { fireEvent, render, screen } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { trackEvent } from "../../analytics";

import Harness from "./TTDDialogTriggerHarness.test.svelte";

vi.mock("../../analytics", () => ({ trackEvent: vi.fn() }));

describe("<TTDDialogTrigger />", () => {
  beforeEach(() => {
    vi.mocked(trackEvent).mockClear();
  });

  it("renders a menu item (through the tunnel) with the default label, icon and AI badge", async () => {
    render(Harness, { setAppState: vi.fn() });
    const item = await screen.findByRole("menuitem");
    expect(item).toHaveTextContent("Text to diagram");
    expect(item).toHaveTextContent("AI");
    expect(item.querySelector("svg")).not.toBeNull();
  });

  it("renders custom children as the label", async () => {
    render(Harness, {
      setAppState: vi.fn(),
      label: createRawSnippet(() => ({ render: () => "<span>Diagram me</span>" })),
    });
    expect(await screen.findByRole("menuitem")).toHaveTextContent("Diagram me");
  });

  it("opens the text-to-diagram tab of the dialog on select", async () => {
    const setAppState = vi.fn();
    render(Harness, { setAppState });
    await fireEvent.click(await screen.findByRole("menuitem"));
    expect(trackEvent).toHaveBeenCalledWith("ai", "dialog open", "ttd");
    expect(setAppState).toHaveBeenCalledWith({
      openDialog: { name: "ttd", tab: "text-to-diagram" },
    });
  });
});
