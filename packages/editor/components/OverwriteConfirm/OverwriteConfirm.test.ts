import { fireEvent, render, waitFor } from "@testing-library/svelte";
import { createRawSnippet } from "svelte";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { editorJotaiStore } from "../../editor-jotai";
import { createFakeEditor } from "../testing/fakeEditor.test.helpers.svelte";

import OverwriteConfirmHarness from "./OverwriteConfirmHarness.test.svelte";
import {
  openConfirmModal,
  overwriteConfirmStateAtom,
} from "./OverwriteConfirmState";

vi.mock("../../actions", () => ({
  actionSaveFileToDisk: { name: "saveFileToDisk" },
}));
vi.mock("../../actions/actionExport", () => ({
  actionChangeExportEmbedScene: { name: "changeExportEmbedScene" },
}));

const modal = (
  props: Partial<Parameters<typeof openConfirmModal>[0]> = {},
) =>
  openConfirmModal({
    title: "Load from file",
    description: "This will replace your content",
    actionLabel: "Replace",
    color: "warning",
    ...props,
  });

// the dialog is portaled to the editor's owner document body
const queryDialog = (_container?: HTMLElement) =>
  document.querySelector(".OverwriteConfirm");

describe("OverwriteConfirmDialog", () => {
  beforeEach(() => {
    editorJotaiStore.set(overwriteConfirmStateAtom, { active: false });
  });

  it("renders nothing until a confirmation is requested", () => {
    const { ctx } = createFakeEditor();
    const { container } = render(OverwriteConfirmHarness, { ctx });
    expect(queryDialog(container)).toBeNull();
  });

  it("shows the requested confirmation with its default actions, and resolves true on confirm", async () => {
    const { ctx } = createFakeEditor();
    const { container } = render(OverwriteConfirmHarness, { ctx });

    const result = modal();
    await waitFor(() => expect(queryDialog(container)).not.toBeNull());

    const dialog = queryDialog(container)!;
    expect(dialog.querySelector("h3")).toHaveTextContent("Load from file");
    const description = dialog.querySelector(".OverwriteConfirm__Description")!;
    expect(description).toHaveClass("OverwriteConfirm__Description--color-warning");
    expect(description).toHaveTextContent("This will replace your content");
    expect(
      description.querySelector(".OverwriteConfirm__Description__icon svg"),
    ).not.toBeNull();
    expect(
      dialog.querySelectorAll(
        ".OverwriteConfirm__Actions .OverwriteConfirm__Actions__Action",
      ),
    ).toHaveLength(2);

    await fireEvent.click(
      description.querySelector<HTMLElement>("button.ExcButton")!,
    );

    await expect(result).resolves.toBe(true);
    await waitFor(() => expect(queryDialog(container)).toBeNull());
  });

  it("accepts a snippet as the description", async () => {
    const { ctx } = createFakeEditor();
    const { container } = render(OverwriteConfirmHarness, { ctx });

    void modal({
      description: createRawSnippet(() => ({
        render: () => "<strong>rich</strong>",
      })),
    });
    await waitFor(() => expect(queryDialog(container)).not.toBeNull());
    expect(
      document.querySelector(".OverwriteConfirm__Description strong"),
    ).toHaveTextContent("rich");
  });

  it("resolves false when the dialog is dismissed", async () => {
    const { ctx } = createFakeEditor();
    const { container } = render(OverwriteConfirmHarness, { ctx });

    const result = modal();
    await waitFor(() => expect(queryDialog(container)).not.toBeNull());

    // Escape inside the modal requests closing
    await fireEvent.keyDown(document.querySelector<HTMLElement>(".Dialog")!, {
      key: "Escape",
    });
    await expect(result).resolves.toBe(false);
    await waitFor(() => expect(queryDialog(container)).toBeNull());
  });

  it("runs the default actions", async () => {
    const { ctx, executeAction, setAppState } = createFakeEditor();
    const { container } = render(OverwriteConfirmHarness, { ctx });

    void modal();
    await waitFor(() => expect(queryDialog(container)).not.toBeNull());

    const actions = document.querySelectorAll<HTMLElement>(
      ".OverwriteConfirm__Actions__Action button",
    );
    await fireEvent.click(actions[0]);
    expect(executeAction).toHaveBeenCalledWith(
      expect.objectContaining({ name: "saveFileToDisk" }),
      "ui",
    );

    await fireEvent.click(actions[1]);
    expect(executeAction).toHaveBeenCalledWith(
      expect.objectContaining({ name: "changeExportEmbedScene" }),
      "ui",
      true,
    );
    expect(setAppState).toHaveBeenCalledWith({
      openDialog: { name: "imageExport" },
    });
  });

  it("prefers the host dialog's actions over the fallback's", async () => {
    const { ctx } = createFakeEditor();
    const { container } = render(OverwriteConfirmHarness, { ctx, host: true });

    void modal();
    await waitFor(() => expect(queryDialog(container)).not.toBeNull());

    expect(document.querySelectorAll(".OverwriteConfirm")).toHaveLength(1);
    expect(document.querySelector("#host-action")).not.toBeNull();
    expect(
      document.querySelector(".OverwriteConfirm__Actions__Action"),
    ).toBeNull();
  });
});
