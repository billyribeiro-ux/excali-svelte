/**
 * With no VITE_APP_* variables set (the shipped default) every backend-dependent
 * feature is off and nothing is ever sent to a hard-wired third-party server.
 */
import { afterEach, describe, expect, it, vi } from "vitest";

import { fireEvent, render, waitFor } from "@svelte-draw/editor/tests/test-utils";

import {
  AI_BACKEND_URL,
  BACKEND_V2_GET_URL,
  BACKEND_V2_POST_URL,
  FIREBASE_CONFIG,
  SENTRY_DSN,
  WS_SERVER_URL,
  isAIConfigured,
  isCollabConfigured,
  isShareLinkConfigured,
} from "#lib/app/app_config.ts";
import { appAtomStore } from "#lib/app/app-atoms.ts";
import { exportToBackend, importFromBackend } from "#lib/app/data/index.ts";
import { loadFilesFromFirebase } from "#lib/app/data/firebase.ts";
import { shareDialogStateAtom } from "#lib/app/share/ShareDialog.ts";

import ShareDialogHarness from "./ShareDialogHarness.test.svelte";

import type { FileId } from "@svelte-draw/element/types";

describe("optional services are disabled when not configured", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("exposes empty/disabled configuration by default", () => {
    expect(BACKEND_V2_GET_URL).toBe("");
    expect(BACKEND_V2_POST_URL).toBe("");
    expect(WS_SERVER_URL).toBe("");
    expect(AI_BACKEND_URL).toBe("");
    expect(SENTRY_DSN).toBe("");
    expect(FIREBASE_CONFIG).toBeNull();
    expect(isShareLinkConfigured).toBe(false);
    expect(isCollabConfigured).toBe(false);
    expect(isAIConfigured).toBe(false);
  });

  it("exportToBackend reports an error and performs no request", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const result = await exportToBackend([], {}, {});
    expect(result.url).toBeNull();
    expect(result.errorMessage).toBeTruthy();
    expect(fetchSpy).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("importFromBackend fails loudly and performs no request", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const alertSpy = vi.spyOn(window, "alert").mockImplementation(() => {});
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await importFromBackend("id", "key")).toEqual({});
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy).not.toHaveBeenCalled();
    alertSpy.mockRestore();
    consoleError.mockRestore();
  });

  it("loadFilesFromFirebase marks every file errored without any request", async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const { loadedFiles, erroredFiles } = await loadFilesFromFirebase(
      "files/shareLinks/x",
      "key",
      ["a" as FileId, "b" as FileId],
    );
    expect(loadedFiles).toEqual([]);
    expect([...erroredFiles.keys()]).toEqual(["a", "b"]);
    expect(fetchSpy).not.toHaveBeenCalled();
    consoleError.mockRestore();
  });

  it("the share dialog hides the 'export to link' section", async () => {
    await render(ShareDialogHarness, { props: { onExportToBackend: vi.fn() } });
    appAtomStore.set(shareDialogStateAtom, { isOpen: true, type: "share" });
    await waitFor(() =>
      expect(document.querySelector(".ShareDialog")).not.toBeNull(),
    );
    expect(document.querySelectorAll(".ShareDialog__picker__header")).toHaveLength(0);
    expect(document.querySelector(".ShareDialog__picker__button")).toBeNull();
    fireEvent.keyDown(document.body, { key: "Escape" });
  });
});
