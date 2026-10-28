import { fireEvent, render, screen, waitFor } from "@testing-library/svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";

import * as clipboard from "../clipboard";

import { makeDialogCtx } from "./dialogTestUtils";
import Harness from "./DialogContextHarness.test.svelte";
import ShareableLinkDialog from "./ShareableLinkDialog.svelte";

describe("ShareableLinkDialog", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const setup = () => {
    const onCloseRequest = vi.fn();
    const setErrorMessage = vi.fn();
    render(Harness, {
      component: ShareableLinkDialog,
      componentProps: {
        link: "https://excalidraw.com/#room=abc,def",
        onCloseRequest,
        setErrorMessage,
      },
      ctx: makeDialogCtx(),
    });
    return { onCloseRequest, setErrorMessage };
  };

  it("renders the link in a readonly field and the security note", () => {
    setup();
    const input = screen.getByRole("textbox") as HTMLInputElement;
    expect(input).toHaveValue("https://excalidraw.com/#room=abc,def");
    expect(input).toHaveAttribute("readonly");
    expect(
      document.querySelector(".ShareableLinkDialog__description"),
    ).toHaveTextContent("🔒");
  });

  it("copies the link to the clipboard and shows the success status", async () => {
    const copy = vi
      .spyOn(clipboard, "copyTextToSystemClipboard")
      .mockResolvedValue(undefined);
    setup();
    await fireEvent.click(screen.getByRole("button", { name: /copy link/i }));
    expect(copy).toHaveBeenCalledWith("https://excalidraw.com/#room=abc,def");
    await waitFor(() =>
      expect(document.querySelector(".ExcButton--status-success")).not.toBeNull(),
    );
  });

  it("reports a clipboard failure through setErrorMessage", async () => {
    vi.spyOn(clipboard, "copyTextToSystemClipboard").mockRejectedValue(
      new Error("denied"),
    );
    const { setErrorMessage } = setup();
    await fireEvent.click(screen.getByRole("button", { name: /copy link/i }));
    await waitFor(() => expect(setErrorMessage).toHaveBeenCalledTimes(1));
  });
});
