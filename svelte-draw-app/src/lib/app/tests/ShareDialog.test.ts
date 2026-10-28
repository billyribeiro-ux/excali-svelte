import { describe, expect, it, vi } from "vitest";

import { fireEvent, render, waitFor } from "@svelte-draw/editor/tests/test-utils";

import { appAtomStore } from "#lib/app/app-atoms.ts";
import { shareDialogStateAtom } from "#lib/app/share/ShareDialog.ts";

import ShareDialogHarness from "./ShareDialogHarness.test.svelte";

// the "export to link" section is only shown when a share backend is configured
vi.mock("#lib/app/app_config.ts", async (importOriginal) => ({
  ...(await importOriginal<typeof import("#lib/app/app_config.ts")>()),
  isShareLinkConfigured: true,
}));

describe("ShareDialog", () => {
  it("opens from the atom, exports to backend and closes", async () => {
    const onExportToBackend = vi.fn();
    await render(ShareDialogHarness, { props: { onExportToBackend } });

    expect(document.querySelector(".ShareDialog")).toBeNull();

    appAtomStore.set(shareDialogStateAtom, { isOpen: true, type: "share" });

    await waitFor(() =>
      expect(document.querySelector(".ShareDialog")).not.toBeNull(),
    );
    // no collabAPI -> only the "export to link" section is shown
    expect(document.querySelectorAll(".ShareDialog__picker__header")).toHaveLength(1);

    fireEvent.click(
      document.querySelector(".ShareDialog__picker__button button")!,
    );
    await waitFor(() => expect(onExportToBackend).toHaveBeenCalledTimes(1));
    await waitFor(() =>
      expect(document.querySelector(".ShareDialog")).toBeNull(),
    );
    expect(appAtomStore.get(shareDialogStateAtom)).toEqual({ isOpen: false });
  });
});
